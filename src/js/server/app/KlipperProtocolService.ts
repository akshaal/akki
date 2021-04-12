import { Inject, Injectable } from 'injection-js';
import { retry, tap, timeout } from 'rxjs/operators';
import { EnvToken } from 'server/akjs/core/EnvToken';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { Logger } from 'server/akjs/core/Logger';
import { Scheduler } from 'server/akjs/core/Scheduler';
import { KlipperCommService } from './KlipperCommService';

export const ENV_KLIPPER_API_MAX_INACTIVITY_MS = new EnvToken({
    id: 'AKKI_KLIPPER_API_MAX_INACTIVITY_MS',
    description:
        'Maximum allowed number of milliseconds before klipper socket considered stuck and reconnect is attempted.',
    defaultValue: '5000',
});

@Injectable()
export class KlipperProtocolService {
    public constructor(
        klipperCommService: KlipperCommService,
        lifecycleEvents: LifecycleEvents,
        scheduler: Scheduler,
        logger: Logger,
        @Inject(ENV_KLIPPER_API_MAX_INACTIVITY_MS) maxInactivityMsStr: string,
    ) {
        const maxInactivityMs = parseInt(maxInactivityMsStr);

        lifecycleEvents.postConstruct$.subscribe(() => {
            klipperCommService.response$.pipe(lifecycleEvents.takeUntilDestroyed()).subscribe((resp) => {
                this._handleResponse(resp);
            });

            klipperCommService.connected$.pipe(lifecycleEvents.takeUntilDestroyed()).subscribe(() => {
                this._handleConnect();
            });

            klipperCommService.disconnected$.pipe(lifecycleEvents.takeUntilDestroyed()).subscribe(() => {
                this._handleDisconnect();
            });

            // Reconnect if klipper is stuck and there is no response within an interval
            klipperCommService.response$
                .pipe(
                    timeout(maxInactivityMs, scheduler.rxjsScheduler),
                    tap({
                        error: () => {
                            if (klipperCommService.reconnect() === 'reconnecting') {
                                logger.error('It seems like Klipper stopped answering. Reconnecting.', {
                                    maxInactivityMs,
                                });
                            }
                        },
                    }),
                    retry(),
                    lifecycleEvents.takeUntilDestroyed(),
                )
                .subscribe();
        });
    }

    private _handleConnect(): void {}

    private _handleDisconnect(): void {}

    private _handleResponse(resp: string): void {}
}
