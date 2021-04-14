import { Inject, Injectable } from 'injection-js';
import { Observable, Subscriber } from 'rxjs';
import { retry, tap, timeout } from 'rxjs/operators';
import { EnvToken } from 'server/akjs/core/EnvToken';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { Logger } from 'server/akjs/core/Logger';
import { Scheduler } from 'server/akjs/core/Scheduler';
import { NanoIdService } from 'server/akjs/nanoid/NanoIdService';
import { KlipperCommService } from './KlipperCommService';

export const ENV_KLIPPER_API_MAX_INACTIVITY_MS = new EnvToken({
    id: 'AKKI_KLIPPER_API_MAX_INACTIVITY_MS',
    description:
        'Maximum allowed number of milliseconds before klipper socket considered stuck and reconnect is attempted.',
    defaultValue: '5000',
});

type RequestOutcome =
    | Readonly<{ kind: 'result'; result: unknown }>
    | Readonly<{ kind: 'error'; error: unknown }>
    | Readonly<{ kind: 'no-reply'; reason: string }>
    | 'disconnected';

const ID_BASE_SIZE = 5;

@Injectable()
export class KlipperProtocolService {
    private readonly _reqInProgressSubById = new Map<string, Subscriber<RequestOutcome>>();
    private readonly _idBase: string;
    private _requestCount = 0;

    public constructor(
        private readonly _klipperCommService: KlipperCommService,
        private readonly _lifecycleEvents: LifecycleEvents,
        scheduler: Scheduler,
        logger: Logger,
        nanoIdService: NanoIdService,
        @Inject(ENV_KLIPPER_API_MAX_INACTIVITY_MS) maxInactivityMsStr: string,
    ) {
        this._idBase = nanoIdService.generate(ID_BASE_SIZE);

        const maxInactivityMs = parseInt(maxInactivityMsStr);

        _lifecycleEvents.postConstruct$.subscribe(() => {
            _klipperCommService.response$.pipe(_lifecycleEvents.takeUntilDestroyed()).subscribe((resp) => {
                this._handleResponse(resp);
            });

            _klipperCommService.disconnected$.pipe(_lifecycleEvents.takeUntilDestroyed()).subscribe(() => {
                this._handleDisconnect();
            });

            // Reconnect if klipper is stuck and there is no response within an interval
            _klipperCommService.response$
                .pipe(
                    timeout(maxInactivityMs, scheduler.rxjsScheduler),
                    tap({
                        error: () => {
                            if (_klipperCommService.reconnect() === 'reconnecting') {
                                logger.error('It seems like Klipper stopped answering. Reconnecting.', {
                                    maxInactivityMs,
                                });
                            }
                        },
                    }),
                    retry(),
                    _lifecycleEvents.takeUntilDestroyed(),
                )
                .subscribe();
        });
    }

    private _handleDisconnect(): void {}

    private _handleResponse(resp: string): void {
        console.log("resp", resp);
    }

    /**
     * Prepares request to klipper. Request will be started upon each subscription. Request will be automatically unsubscribed
     * upon destruction of the container.
     */
    public request(req: Readonly<{ method: string; params: unknown; timeoutMs: number }>): Observable<RequestOutcome> {
        const { method, params, timeoutMs } = req;

        // TODO: Timeout
        return new Observable<RequestOutcome>((subscriber) => {
            this._requestCount += 1;
            const id = `${this._idBase}-${this._requestCount}`;

            const reqStr = JSON.stringify({ id, method, params });

            console.log('requested', id, reqStr);

            if (this._klipperCommService.send(reqStr) === 'sent') {
                console.log("sent");
                this._reqInProgressSubById.set(id, subscriber);
            } else {
                subscriber.next('disconnected');
                subscriber.complete();
            }

            // Teardown function
            return (): void => {
                console.log('tearing down', id);
                this._reqInProgressSubById.delete(id);
            };
        }).pipe(this._lifecycleEvents.takeUntilDestroyed());
    }
}
