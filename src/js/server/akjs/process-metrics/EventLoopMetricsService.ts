import { Inject, Injectable } from 'injection-js';
import { HighResTime, highResTimeToSeconds } from '../misc/HighResTime';
import { MetricsService } from '../metrics/MetricsService';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { TimeService } from '../process/TimeService';
import { EnvToken } from '../core/EnvToken';
import { Scheduler, Cancellable } from '../core/Scheduler';

export const ENV_EVENT_LOOP_MONITORING_RESOLUTION_MS = new EnvToken({
    id: 'AKJS_EVENT_LOOP_MONITORING_RESOLUTION_MS',
    description:
        'Resolution of nodejs event loop monitoring in milliseconds. Smaller means we measure more often but it means more CPU load caused by monitoring itself.',
    defaultValue: '50',
});

@Injectable()
export class EventLoopMetricsService {
    public constructor(
        metricsService: MetricsService,
        lifecycleEvents: LifecycleEvents,
        timeService: TimeService,
        scheduler: Scheduler,
        @Inject(ENV_EVENT_LOOP_MONITORING_RESOLUTION_MS) resolutionMsStr: string,
    ) {
        const resolutionMs = parseInt(resolutionMsStr);

        lifecycleEvents.postConstruct$.subscribe(() => {
            const summary = metricsService.createSummary({
                name: 'akjs_nodejs_event_loop_summary',
                help: 'Summary of event loop delays.',
                maxAgeSeconds: 600,
                ageBuckets: 5,
                percentiles: [0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 0.999],
            });

            const reportEventLoopLag = (start: HighResTime): void => {
                summary.observe(highResTimeToSeconds(timeService.elapsedHighResTimeSince(start)));
                scheduleEventLoopReporting();
            };

            let cancellable: Cancellable | undefined;

            // Code uses clearTimeout, setTimeout, setImmediate by intention... that's actually what we test: setImmediate

            const scheduleEventLoopReporting = (): void => {
                cancellable = scheduler.setTimeout(resolutionMs, () => {
                    const start = timeService.nowHighResTime();
                    cancellable = scheduler.setImmediate(() => {
                        reportEventLoopLag(start);
                    });
                });
            };

            scheduleEventLoopReporting();

            lifecycleEvents.preDestroy$.subscribe(() => {
                if (cancellable) {
                    cancellable.cancel();
                }
            });
        });
    }
}
