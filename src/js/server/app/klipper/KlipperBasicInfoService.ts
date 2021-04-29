/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
import { Inject, Injectable } from 'injection-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { ENV_APP_VERSION } from 'server/akjs/core/env_tokens';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { Logger } from 'server/akjs/core/Logger';
import { asPrinterAttributeObservable } from './asPrinterAttributeObservable';
import { KlipperCommService } from './KlipperCommService';
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
        private readonly _klipperProtocolService: KlipperProtocolService,
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
            .subscribe((outcome) => {
                if (outcome.kind === 'result') {
                    const { result } = outcome;
                    this._logger.info(`Connected to Klipper ${result.software_version}.`);
                } else {
                    this._klipperUtils.logFailedRequestOutcome(outcome);
                }
            });

        this._klipperProtocolService
            .subscribeKlipper({
                method: 'objects/subscribe',
                params: { objects: { webhooks: ['state', 'state_message'] } },
            })
            .subscribe((outcome) => {
                console.log(outcome);
            });

        this._klipperProtocolService
            .subscribeKlipper({ method: 'objects/subscribe', params: { objects: { toolhead: ['homed_axes'] } } })
            .subscribe((outcome) => {
                console.log('homed', outcome);
            });

        this._klipperProtocolService
            .subscribeKlipper({
                method: 'objects/subscribe',
                params: { objects: { extruder: ['temperature', 'target'], heater_bed: ['temperature', 'target'] } },
            })
            .subscribe((outcome) => {
                console.log('temp', outcome);
            });

        this._klipperProtocolService
            .subscribeKlipper({ method: 'gcode/subscribe_output', params: {} })
            .subscribe((outcome) => {
                console.log('gcode output', outcome);
            });
    }
}
