import { expect } from 'chai';
import { DateServiceForTest } from '../core/DateServiceForTest';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { LoggerForTest } from '../core/LoggerForTest';
import { SchedulerForTest } from '../core/SchedulerForTest';
import { MetricsService } from '../metrics/MetricsService';
import { TimeServiceForTest } from '../process/TimeServiceForTest';
import { EventLoopMetricsService } from './EventLoopMetricsService';

describe('EventLoopMetricsService', () => {
    let logger: LoggerForTest;
    let lifecycleEvents: LifecycleEventsImpl;
    let metricsService: MetricsService;
    let timeService: TimeServiceForTest;
    let dateService: DateServiceForTest;
    let scheduler: SchedulerForTest;

    beforeEach(() => {
        logger = new LoggerForTest();
        dateService = new DateServiceForTest();
        scheduler = new SchedulerForTest(dateService);
        timeService = new TimeServiceForTest(dateService);
        timeService.markAsStart();

        lifecycleEvents = new LifecycleEventsImpl();
        metricsService = new MetricsService(lifecycleEvents, logger);

        new EventLoopMetricsService(metricsService, lifecycleEvents, timeService, scheduler, '50');
    });

    it('should work', async () => {
        expect(await metricsService.getMetrics()).to.equal('');

        await lifecycleEvents.onBootstrapPostConstruct();

        expect(await metricsService.getMetrics()).to.equal(
            '# HELP akjs_nodejs_event_loop_summary Summary of event loop delays.\n' +
                '# TYPE akjs_nodejs_event_loop_summary summary\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.1"} 0\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.25"} 0\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.5"} 0\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.75"} 0\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.9"} 0\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.99"} 0\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.999"} 0\n' +
                'akjs_nodejs_event_loop_summary_sum 0\n' +
                'akjs_nodejs_event_loop_summary_count 0\n',
        );

        scheduler.immediateDelay = 2;
        dateService.addMilliseconds(52);

        expect(await metricsService.getMetrics()).to.equal(
            '# HELP akjs_nodejs_event_loop_summary Summary of event loop delays.\n' +
                '# TYPE akjs_nodejs_event_loop_summary summary\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.1"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.25"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.5"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.75"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.9"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.99"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.999"} 0.002\n' +
                'akjs_nodejs_event_loop_summary_sum 0.002\n' +
                'akjs_nodejs_event_loop_summary_count 1\n',
        );

        scheduler.immediateDelay = 1;
        dateService.addMilliseconds(51);

        expect(await metricsService.getMetrics()).to.equal(
            '# HELP akjs_nodejs_event_loop_summary Summary of event loop delays.\n' +
                '# TYPE akjs_nodejs_event_loop_summary summary\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.1"} 0.001\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.25"} 0.001\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.5"} 0.0015\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.75"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.9"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.99"} 0.002\n' +
                'akjs_nodejs_event_loop_summary{quantile="0.999"} 0.002\n' +
                'akjs_nodejs_event_loop_summary_sum 0.003\n' +
                'akjs_nodejs_event_loop_summary_count 2\n',
        );

        await lifecycleEvents.onBootstrapPreDestroy();

        expect(logger.events).to.deep.equal([
            {
                msg: 'Added metric: akjs_nodejs_event_loop_summary: Summary of event loop delays.',
                arg: undefined,
                level: 'debug',
            },
        ]);
    });
});
