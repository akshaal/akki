import { Inject, Injectable, Optional } from 'injection-js';
import { Observable, Subject, timer } from 'rxjs';
import { InjectionToken } from '../container/InjectionToken';
import { EnvToken } from '../core/EnvToken';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { Logger } from '../core/Logger';
import { Scheduler } from '../core/Scheduler';
import { DebugEventBus } from '../debug/DebugEventBus';
import { NextionInterface, openNextionPort as realOpenNextionPort } from './lib';

export interface NextionTouchEvent {
    readonly isRelease: boolean;
}

export const ENV_NEXTION_PORT = new EnvToken({
    id: 'AKJS_NEXTION_PORT',
    description: 'Nextion device port.',
    defaultValue: '/dev/ttyAMA0',
});

export const ENV_NEXTION_PORT_AUTO_REOPEN_DELAY_MS = new EnvToken({
    id: 'AKJS_NEXTION_PORT_AUTO_REOPEN_DELAY_MS',
    description: 'Delay between reopening of the nextion display port in case of error.',
    defaultValue: '1000',
});

export const ENV_NEXTION_DISPLAY_AUTO_REFRESH_DELAY_MS = new EnvToken({
    id: 'AKJS_NEXTION_DISPLAY_AUTO_REFRESH_DELAY_MS',
    description: 'Delay between automatic refresh of nextion display (useful if display goes offline and returns).',
    defaultValue: '1000',
});

export const OPEN_NEXTION_PORT_FUNCTION = new InjectionToken<typeof realOpenNextionPort>(
    'AKJS_OPEN_NEXTION_PORT_FUNCTION',
);

export const NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT = Symbol('Nextion.OpenPortCompleted');

export const NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT = Symbol('Nextion.SetValueCompleted');

export const NEXTION_CLOSE_COMPLETED_DEBUG_EVENT = Symbol('Nextion.CloseCompleted');

// --------------------------------------------------------------

export abstract class BaseNextionDisplayService {
    protected abstract setValueIfChanged(name: string, value: number | string): void;

    /**
     * Set color of a text element with the given id. Note that components of the RGB are given as floating point
     * number in percents ranging from 0 to 100 inclusive. Given RGB value gets converted into the RGB565 that
     * the nextion display uses. Conversion rounds values to the closest element. Not down or up. So the result might
     * be different from the one obtained using an online calculator that rounds down.
     */
    public setTextColor(params: {
        readonly element: string;
        readonly rgbPct100: Readonly<[number, number, number]>;
    }): void {
        const { rgbPct100, element } = params;

        const color16bit =
            (pct2clrComp(rgbPct100[0], 5) << 11) + (pct2clrComp(rgbPct100[1], 6) << 5) + pct2clrComp(rgbPct100[2], 5);

        this.setValueIfChanged(`${element}.pco`, color16bit);
    }

    public setText(params: { readonly element: string; readonly value: string }): void {
        this.setValueIfChanged(`${params.element}.txt`, params.value);
    }

    public setPic(params: { element: number; pic: number }): void {
        this.setValueIfChanged(`${params.element}.pic`, params.pic);
    }

    public setBrightnessPct100(pct100: number): void {
        this.setValueIfChanged('dim', pct100 < 0 ? 0 : pct100 > 100 ? 100 : pct100);
    }
}

// --------------------------------------------------------------

@Injectable()
export class NextionDisplayService extends BaseNextionDisplayService {
    private _nextion?: NextionInterface;
    private _canWrite = false;

    // List to maintain order of values we write (so we can cycle names we write). see _setValue
    private readonly _valueNamesToWrite: string[] = [];

    // Map from value name to the value itself.
    // This let us write newest version of value...
    private readonly _values: { [key: string]: number | string } = {};

    public readonly touchEvents$: Observable<NextionTouchEvent>;

    public constructor(
        scheduler: Scheduler,
        private readonly _lifecycleEvents: LifecycleEvents,
        private readonly _debugEventBus: DebugEventBus,
        private readonly _logger: Logger,
        @Inject(ENV_NEXTION_PORT) private readonly _port: string,
        @Inject(ENV_NEXTION_PORT_AUTO_REOPEN_DELAY_MS) autoReopenDelayMsStr: string,
        @Inject(ENV_NEXTION_DISPLAY_AUTO_REFRESH_DELAY_MS) autoRefreshDelayMsStr: string,
        @Inject(OPEN_NEXTION_PORT_FUNCTION)
        @Optional()
        openNextionPort: typeof realOpenNextionPort,
    ) {
        super();

        // eslint-disable-next-line no-param-reassign
        openNextionPort ??= realOpenNextionPort;

        const autoReopenDelayMs = parseInt(autoReopenDelayMsStr);
        const autoRefreshDelayMs = parseInt(autoRefreshDelayMsStr);

        let opening = false;

        const touchEventsSubject = new Subject<NextionTouchEvent>();
        this.touchEvents$ = touchEventsSubject.pipe(this._lifecycleEvents.takeUntilDestroyed());

        this._lifecycleEvents.postConstruct$.subscribe(() => {
            this._lifecycleEvents.preDestroy$.subscribe(() => {
                this._close();
            });

            // Auto-reopen port if it's closed
            timer(0, autoReopenDelayMs, scheduler.rxjsScheduler)
                .pipe(this._lifecycleEvents.takeUntilDestroyed())
                .subscribe(() => {
                    if (
                        !this._lifecycleEvents.containerDestroyed &&
                        !opening &&
                        (!this._nextion || !this._nextion.isOpen)
                    ) {
                        this._nextion = undefined;

                        opening = true;
                        openNextionPort(this._port)
                            .then((nextion) => {
                                this._logger.debug(`Connected to nextion display: ${this._port}`);
                                this._setupNewlyOpenedNextion(nextion, touchEventsSubject);
                            })
                            .catch((reason: unknown) => {
                                this._logger.error('Failed to connect to nextion display!', {
                                    port: this._port,
                                    reason,
                                });
                            })
                            .finally(() => {
                                opening = false;
                                this._debugEventBus.broadcastAndLog({
                                    type: NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT,
                                    port: this._port,
                                });
                            });
                    }
                });

            // Attempt writing (This is not really needed, but who knows)
            timer(autoRefreshDelayMs, autoRefreshDelayMs, scheduler.rxjsScheduler)
                .pipe(this._lifecycleEvents.takeUntilDestroyed())
                .subscribe(() => {
                    this._forceDisplayRefresh();
                });
        });
    }

    private _setupNewlyOpenedNextion(nextion: NextionInterface, touchEventsSubject: Subject<NextionTouchEvent>): void {
        this._nextion = nextion;

        // This condition is needed because of racing.. we might have started opening and
        // container shutdown happened while we have been opening the port
        if (this._lifecycleEvents.containerDestroyed) {
            this._close();
            return;
        }

        // On error
        nextion.on('error', (error) => {
            this._logger.error('Nextion display error', { error });
            this._close();
        });

        // On disconnect
        nextion.on('disconnected', () => {
            this._logger.error('Nextion display disconnected');
            this._close();
        });

        // On touch event
        nextion.on('touchEvent', (data) => {
            touchEventsSubject.next({
                isRelease: data.releaseEvent,
            });
        });

        // Allow write
        this._canWrite = true;

        // Setup
        this._forceDisplayRefresh();
    }

    /**
     * Queue values for write. Needed in case of display reconnection.
     **/
    private _forceDisplayRefresh(): void {
        for (const name in this._values) {
            if (!this._valueNamesToWrite.includes(name)) {
                this._valueNamesToWrite.push(name);
            }
        }

        if (this._valueNamesToWrite.length !== 0) {
            this._writeNextValueIfCan();
        }
    }

    private _close(): void {
        if (!this._nextion) {
            /* istanbul ignore next */
            return;
        }

        if (this._nextion.isOpen) {
            this._nextion.close().finally(() => {
                this._debugEventBus.broadcastAndLog({ type: NEXTION_CLOSE_COMPLETED_DEBUG_EVENT });
            });
        }

        this._canWrite = false;
        this._nextion = undefined;
    }

    private _writeNextValueIfCan(): void {
        if (!this._nextion || !this._canWrite || this._valueNamesToWrite.length === 0) {
            return;
        }

        const [name] = this._valueNamesToWrite;
        let value = this._values[name];

        if (typeof value === 'string') {
            value = `"${value}"`;
        }

        this._canWrite = false;
        this._nextion
            .setValue(name, value)
            .then(() => {
                // Remove from list of values to write
                // Note, that we don't remove from map of value, because we might use it later
                // for change detection.
                this._valueNamesToWrite.shift();

                this._canWrite = true;
                this._writeNextValueIfCan();
            })
            .catch((reason: unknown) => {
                this._logger.error('Failed set value!', { name, value, reason });
                this._close();
            })
            .finally(() => {
                this._debugEventBus.broadcastAndLog({ type: NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT, name, value });
            });
    }

    // Implements abstract method from BaseNextionDisplayService

    protected setValueIfChanged(name: string, value: number | string): void {
        if (this._values[name] === value) {
            return;
        }

        if (!this._valueNamesToWrite.includes(name)) {
            this._valueNamesToWrite.push(name);
        }

        this._values[name] = value;
        this._writeNextValueIfCan();
    }
}

// --------------------------------------------------------------

function pct2clrComp(pct: number, bits: number): number {
    if (pct < 0) {
        return 0;
    }

    const m = (1 << bits) - 1;

    if (pct > 100) {
        return m;
    }

    return Math.round((pct * m) / 100);
}
