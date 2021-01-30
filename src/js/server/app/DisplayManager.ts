import { Injectable } from 'injection-js';
import { timer } from 'rxjs';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { Scheduler } from 'server/akjs/core/Scheduler';
import { NextionDisplayService } from 'server/akjs/nextion/NextionDisplayService';

@Injectable()
export class DisplayManager {
    public constructor(
        nextionDisplayService: NextionDisplayService,
        lifecycleEvents: LifecycleEvents,
        scheduler: Scheduler,
    ) {
        lifecycleEvents.postConstruct$.subscribe(() => {
            // TODO: ...
            timer(0, 1000, scheduler.rxjsScheduler)
                .pipe(lifecycleEvents.takeUntilDestroyed())
                .subscribe((x) => {
                    nextionDisplayService.setBrightnessPct100(x % 2 == 1 ? 100 : 10);
                });
        });
    }
}
