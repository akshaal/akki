import { Injectable } from 'injection-js';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { Logger } from '../core/Logger';
import { MetricsService } from '../metrics/MetricsService';

const L_LEVEL = 'level';

@Injectable()
export class LoggingMetricsService {
    public constructor(metricsService: MetricsService, lifecycleEvents: LifecycleEvents, logger: Logger) {
        lifecycleEvents.postConstruct$.subscribe(() => {
            const counter = metricsService.createCounter({
                name: 'akjs_logging_count',
                help: 'Number of log messages.',
                labelNames: [L_LEVEL],
            });

            metricsService.update$.pipe(lifecycleEvents.takeUntilDestroyed()).subscribe(() => {
                counter.reset();
                counter.inc({ [L_LEVEL]: 'debug' }, logger.debugEventsLogged);
                counter.inc({ [L_LEVEL]: 'info' }, logger.infoEventsLogged);
                counter.inc({ [L_LEVEL]: 'error' }, logger.errorEventsLogged);
                counter.inc({ [L_LEVEL]: 'warning' }, logger.warnEventsLogged);
            });
        });
    }
}
