import { Inject, Injectable } from 'injection-js';
import { Observable, of, Subscriber } from 'rxjs';
import { catchError, retry, tap, timeout } from 'rxjs/operators';
import { EnvToken } from 'server/akjs/core/EnvToken';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { Logger } from 'server/akjs/core/Logger';
import { Scheduler } from 'server/akjs/core/Scheduler';
import { hasProperty } from 'server/akjs/misc/hasProperty';
import { NanoIdService } from 'server/akjs/nanoid/NanoIdService';
import { KlipperCommService } from './KlipperCommService';

export const ENV_KLIPPER_API_MAX_INACTIVITY_MS = new EnvToken({
    id: 'AKKI_KLIPPER_API_MAX_INACTIVITY_MS',
    description:
        'Maximum allowed number of milliseconds before klipper socket considered stuck and reconnect is attempted.',
    defaultValue: '5000',
});

// TODO: Subscriptions

// NOTE: no-reply means that request is sent to the klipper, but no response received.
// NOTE: while 'disconnected' means that request is not even sent.
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
        private readonly _scheduler: Scheduler,
        private readonly _logger: Logger,
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
                    timeout(maxInactivityMs, _scheduler.rxjsScheduler),
                    tap({
                        error: () => {
                            if (_klipperCommService.reconnect() === 'reconnecting') {
                                _logger.error('It seems like Klipper stopped answering. Reconnecting.', {
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

    private _handleDisconnect(): void {
        // See NOTE for the type RequestOutcome for difference between 'disconnected ' and 'no-reply' with reason 'disconnected'.
        const outcome: RequestOutcome = { kind: 'no-reply', reason: 'disconnected' };
        for (const subscriber of this._reqInProgressSubById.values()) {
            subscriber.next(outcome);
            subscriber.complete();
        }
    }

    private _handleResponse(response: string): void {
        const obj: unknown = JSON.parse(response);
        const id = hasProperty(obj, 'id') && typeof obj.id === 'string' ? obj.id : '';
        const subscriber = this._reqInProgressSubById.get(id);

        if (subscriber) {
            let outcome: RequestOutcome;
            const result = hasProperty(obj, 'result') && typeof obj.result === 'object' ? obj.result : undefined;
            if (typeof result === 'object') {
                outcome = { kind: 'result', result };
            } else {
                const error = hasProperty(obj, 'error') && typeof obj.error === 'object' ? obj.error : undefined;
                if (typeof error === 'object') {
                    outcome = { kind: 'error', error };
                } else {
                    outcome = { kind: 'no-reply', reason: 'Strange response' };
                    this._logger.error('Strange response from Klipper', { resp: response });
                }
            }
            subscriber.next(outcome);
            subscriber.complete();
        } else {
            this._logger.error('Strange response from Klipper', { resp: response });
        }
    }

    /**
     * Prepares request to klipper. Request will be started upon each subscription. Request will be automatically unsubscribed
     * upon destruction of the container.
     */
    public request(req: Readonly<{ method: string; params: unknown; timeoutMs: number }>): Observable<RequestOutcome> {
        const { method, params, timeoutMs } = req;

        return new Observable<RequestOutcome>((subscriber) => {
            this._requestCount += 1;
            const id = `${this._idBase}-${this._requestCount}`;

            const reqStr = JSON.stringify({ id, method, params });

            if (this._klipperCommService.send(reqStr) === 'sent') {
                this._reqInProgressSubById.set(id, subscriber);
            } else {
                subscriber.next('disconnected');
                subscriber.complete();
            }

            // Teardown function
            return (): void => {
                this._reqInProgressSubById.delete(id);
            };
        }).pipe(
            timeout(timeoutMs, this._scheduler.rxjsScheduler),
            catchError(() => of<RequestOutcome>({ kind: 'no-reply', reason: 'Timeout' })),
            this._lifecycleEvents.takeUntilDestroyed(),
        );
    }
}
