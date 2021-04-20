/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/naming-convention */
import { Inject, Injectable } from 'injection-js';
import { Observable, of, Subject, Subscriber } from 'rxjs';
import { catchError, filter, retry, tap, timeout } from 'rxjs/operators';
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
    defaultValue: '8000',
});

type Obj = Record<string, unknown>;

// NOTE: no-reply means that request is sent to the klipper, but no response received.
// NOTE: while 'disconnected' means that request is not even sent.
type RequestOutcome =
    | Readonly<{ kind: 'result'; result: Obj }>
    | Readonly<{ kind: 'error'; error: Obj }>
    | Readonly<{ kind: 'no-reply'; reason: string }>
    | 'disconnected';

const ID_BASE_SIZE = 5;

const SUBSCRIBE_TIMEOUT_MS = 1000;

@Injectable()
export class KlipperProtocolService {
    private readonly _klipperSubscriptionById = new Map<string, Subject<Obj>>();
    private readonly _reqInProgressSubById = new Map<string, Subscriber<RequestOutcome>>();
    private readonly _idBase: string;
    private _idIdx = 0;

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
        // The map will be cleared from teardown method, no need to clear it here.
        const outcome: RequestOutcome = { kind: 'no-reply', reason: 'disconnected' };
        for (const subscriber of this._reqInProgressSubById.values()) {
            subscriber.next(outcome);
            subscriber.complete();
        }

        // Complete klipper-subscriptions
        for (const x of this._klipperSubscriptionById.values()) {
            x.complete();
        }
        this._klipperSubscriptionById.clear();
    }

    private _handleResponse(response: string): void {
        const obj: unknown = JSON.parse(response);
        const id = hasProperty(obj, 'id') && typeof obj.id === 'string' ? obj.id : '';
        const subscriber = this._reqInProgressSubById.get(id);

        if (subscriber) {
            let outcome: RequestOutcome;
            const result =
                hasProperty(obj, 'result') && typeof obj.result === 'object' ? (obj.result as Obj) : undefined;

            if (typeof result === 'object') {
                outcome = { kind: 'result', result };
            } else {
                const error =
                    hasProperty(obj, 'error') && typeof obj.error === 'object' ? (obj.error as Obj) : undefined;
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
            const akkiSubId = hasProperty(obj, 'akkiSubId') && typeof obj.akkiSubId === 'string' ? obj.akkiSubId : '';
            const params = hasProperty(obj, 'params') && typeof obj.params === 'object' ? (obj.params as Obj) : '';
            const subj = this._klipperSubscriptionById.get(akkiSubId);

            if (akkiSubId && subj && typeof params === 'object') {
                subj.next(params);
            } else {
                this._logger.error('Strange response from Klipper', { resp: response });
            }
        }
    }

    /**
     * Prepares request to klipper. Request will be started upon each subscription. Request will be automatically unsubscribed
     * upon destruction of the container.
     */
    public makeKlipperRequest(
        req: Readonly<{ method: string; params?: Obj; timeoutMs: number }>,
    ): Observable<RequestOutcome> {
        const { method, params, timeoutMs } = req;

        return new Observable<RequestOutcome>((subscriber) => {
            const id = this._genNextId();
            const reqStr = JSON.stringify({ id, method, params: params ?? {} });

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

    /**
     * Subscribes for updates of the given method + params. Unlike 'makeKlipperRequest' method, subscription and requests occurs immediately.
     */
    public subscribeKlipper(req: Readonly<{ method: string; params?: Obj }>): Observable<Obj> {
        const { method, params } = req;
        const akkiSubId = this._genNextId();

        const subj = new Subject<Obj>();
        this._klipperSubscriptionById.set(akkiSubId, subj);

        const error = (reason: string, details?: unknown): void => {
            this._logger.error(`Unable to subscribe to ${method}: ${reason}`, details);
            subj.complete();
            this._klipperSubscriptionById.delete(akkiSubId);
        };

        this.makeKlipperRequest({
            method,
            params: { ...(params ?? {}), response_template: { akkiSubId } },
            timeoutMs: SUBSCRIBE_TIMEOUT_MS,
        }).subscribe((outcome) => {
            if (outcome === 'disconnected') {
                error('Klipper is already disconnected.');
            } else if (outcome.kind === 'no-reply') {
                error(`No reply from Klipper: ${outcome.reason}.`);
            } else if (outcome.kind === 'error') {
                error(`Error from Klipper.`, { error: outcome.error });
            }
        });

        return subj;
    }

    private _genNextId(): string {
        this._idIdx += 1;
        return `${this._idBase}-${this._idIdx}`;
    }
}
