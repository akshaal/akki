import { Injectable } from 'injection-js';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { KlipperCommService } from './KlipperCommService';
import { KlipperProtocolService } from './KlipperProtocolService';

@Injectable()
export class KlipperService {
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
        this._klipperProtocolService.request({ method: 'info', params: {}, timeoutMs: 3000 }).subscribe(outcome => {
            console.log("Outcome", outcome);
        });
    }
}
