import { Injectable } from 'injection-js';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
//import { NextionDisplayService } from 'server/akjs/nextion/NextionDisplayService';
import { KlipperService } from './KlipperService';

@Injectable()
export class DisplayManager {
    public constructor(
        //nextionDisplayService: NextionDisplayService,
        lifecycleEvents: LifecycleEvents,
        klipperService: KlipperService,
    ) {
        lifecycleEvents.postConstruct$.subscribe(() => {});
    }
}
