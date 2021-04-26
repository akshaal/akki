/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
import { Inject, Injectable } from 'injection-js';
import { ENV_APP_VERSION } from 'server/akjs/core/env_tokens';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { Logger } from 'server/akjs/core/Logger';
import { KlipperCommService } from './KlipperCommService';
import { KlipperProtocolService } from './KlipperProtocolService';

@Injectable()
export class KlipperBasicInfoService {
    public constructor(
        private readonly _klipperProtocolService: KlipperProtocolService,
        private readonly _logger: Logger,
        @Inject(ENV_APP_VERSION) private readonly _appVersion: string,
        klipperCommService: KlipperCommService,
        lifecycleEvents: LifecycleEvents,
    ) {
        lifecycleEvents.postConstruct$.subscribe(() => {
            klipperCommService.connected$.pipe(lifecycleEvents.takeUntilDestroyed()).subscribe(() => {
                this._handleConnect();
            });
        });
    }

    private _handleConnect(): void {
        // TODO: timeout value
        this._klipperProtocolService
            .makeKlipperRequest({
                method: 'info',
                params: { client_info: { name: 'akki', version: this._appVersion } },
                timeoutMs: 1000,
            })
            .subscribe((outcome) => {
                if (outcome.kind === 'result') {
                    const {result} = outcome;
                    this._logger.info(`Connected to Klipper ${result.software_version}.`);
                } else {
                    // TODO: Log error
                    console.log('info Outcome', outcome);
                }
            });

        /*
        this._klipperProtocolService
            .subscribeKlipper({ method: 'gcode/subscribe_output', params: {} })
            .subscribe((outcome) => {
                console.log('gcode output', outcome);
            });*/
    }
}
