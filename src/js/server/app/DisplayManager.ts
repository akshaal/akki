import { Injectable } from 'injection-js';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { KlipperBasicInfoService } from './klipper/KlipperBasicInfoService';
//import { NextionDisplayService } from 'server/akjs/nextion/NextionDisplayService';

@Injectable()
export class DisplayManager {
    public constructor(
        //nextionDisplayService: NextionDisplayService,
        lifecycleEvents: LifecycleEvents,
        klipperBasicInfoService: KlipperBasicInfoService,
    ) {
        lifecycleEvents.postConstruct$.subscribe(() => {});
    }
}
