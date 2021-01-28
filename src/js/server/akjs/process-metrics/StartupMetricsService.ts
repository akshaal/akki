import { Inject, Injectable } from 'injection-js';
import { DateService } from '../core/DateService';
import { ENV_APP_VERSION } from '../core/env_tokens';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { MetricsService } from '../metrics/MetricsService';
import { TimeService } from '../process/TimeService';

const L_VERSION = 'version';

@Injectable()
export class StartupMetricsService {
    public constructor(
        metricsService: MetricsService,
        lifecycleEvents: LifecycleEvents,
        timeService: TimeService,
        dateService: DateService,
        @Inject(ENV_APP_VERSION) appVersion: string,
    ) {
        const initDate = dateService.getCurrentDate();
        const initMs = initDate.getTime();
        const startTimeSecs = initMs / 1000 - timeService.uptime();

        lifecycleEvents.postConstruct$.subscribe(() => {
            // For Grafana... it needs value as time in milliseconds to enable de-duplication of annotation.
            metricsService
                .createGauge({
                    name: 'akjs_startup_info',
                    help: 'Info on startup.',
                    labelNames: [L_VERSION],
                    aggregator: 'omit',
                })
                .set({ [L_VERSION]: appVersion }, initMs);

            // Setup process startup
            metricsService
                .createGauge({
                    name: 'akjs_process_start_time_seconds',
                    help: 'Start time of the process since unix epoch in seconds.',
                    aggregator: 'omit',
                })
                .set(Math.round(startTimeSecs));
        });
    }
}
