/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
import { Inject, Injectable } from 'injection-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { ENV_APP_VERSION } from 'server/akjs/core/env_tokens';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { Logger } from 'server/akjs/core/Logger';
import { asPrinterAttributeObservable } from './asPrinterAttributeObservable';
import { KlipperCommService } from './KlipperCommService';
import { KlipperEndpointsService } from './KlipperEndpointsService';
import { KlipperProtocolService } from './KlipperProtocolService';
import { KlipperUtils } from './KlipperUtils';

const INFO_CMD_TIMEOUT_MS = 1000;

@Injectable()
export class KlipperBasicInfoService {
    private readonly _stateSubj = new BehaviorSubject<string | null>(null);
    public readonly state$: Observable<string | null> = asPrinterAttributeObservable({
        attrSubj: this._stateSubj,
        disconnected$: this._klipperCommService.disconnected$,
    });

    public constructor(
        private readonly _klipperCommService: KlipperCommService,
        private readonly _klipperProtocolService: KlipperProtocolService, // TODO: Don't use it directly, use KlipperEndpointService
        private readonly _klipperEndpointsService: KlipperEndpointsService,
        private readonly _logger: Logger,
        private readonly _klipperUtils: KlipperUtils,
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
        this._klipperProtocolService
            .makeKlipperRequest({
                method: 'info',
                params: { client_info: { name: 'akki', version: this._appVersion } },
                timeoutMs: INFO_CMD_TIMEOUT_MS,
            })
            .subscribe((resp) => {
                if (resp.kind === 'result') {
                    const { result } = resp;
                    this._logger.info(`Connected to Klipper ${result.software_version}.`);
                } else {
                    this._klipperUtils.logFailedRequestOutcome(resp);
                }
            });

        this._klipperEndpointsService
            .subscribeObjects({ webhooks: ['state' as const, 'state_message' as const] })
            .subscribe((resp) => {
                console.log('st.stat', resp.status);
                console.log('st.ev', resp.eventtime);
            });

        this._klipperEndpointsService.subscribeObjects({ toolhead: ['homed_axes' as const] }).subscribe((resp) => {
            console.log('h.stat', resp.status);
            console.log('h.ev', resp.eventtime);
        });

        this._klipperEndpointsService
            .subscribeObjects({
                extruder: ['temperature' as const, 'target' as const],
                heater_bed: ['temperature' as const, 'target' as const],
            })
            .subscribe((resp) => {
                console.log('temp.stat', resp.status);
                console.log('temp.ev', resp.eventtime);
            });

        this._klipperProtocolService
            .subscribeKlipper({ method: 'gcode/subscribe_output', params: {} })
            .subscribe((resp) => {
                console.log('gcode output', resp);
            });
    }
}
