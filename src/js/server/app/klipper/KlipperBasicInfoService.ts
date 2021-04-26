import { Injectable } from 'injection-js';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { KlipperCommService } from './KlipperCommService';
import { KlipperProtocolService } from './KlipperProtocolService';

@Injectable()
export class KlipperBasicInfoService {
    public constructor(
        private readonly _klipperProtocolService: KlipperProtocolService,
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
        // TODO: params { "client_info": { "version": "v1"} }
        // TODO: timeout value
        this._klipperProtocolService
            .makeKlipperRequest({ method: 'info', params: {}, timeoutMs: 8000 })
            .subscribe((outcome) => {
                console.log('info Outcome', outcome);
            });

        this._klipperProtocolService
            .makeKlipperRequest({ method: 'info2', params: {}, timeoutMs: 8000 })
            .subscribe((outcome) => {
                console.log('info2 Outcome', outcome);
            });

        this._klipperProtocolService
            .subscribeKlipper({ method: 'gcode/subscribe_output', params: {} })
            .subscribe((outcome) => {
                console.log('gcode output', outcome);
            });
    }
}
