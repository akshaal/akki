import { expect } from 'chai';
import { DateServiceForTest } from '../core/DateServiceForTest';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { LoggerForTest } from '../core/LoggerForTest';
import { MetricsService } from '../metrics/MetricsService';
import { TimeServiceForTest } from '../process/TimeServiceForTest';
import { StartupMetricsService } from './StartupMetricsService';

describe('StartupMetricsService', () => {
    let logger: LoggerForTest;
    let lifecycleEvents: LifecycleEventsImpl;
    let metricsService: MetricsService;
    let timeService: TimeServiceForTest;
    let dateService: DateServiceForTest;

    beforeEach(() => {
        logger = new LoggerForTest();
        dateService = new DateServiceForTest();
        timeService = new TimeServiceForTest(dateService);
        dateService.addSeconds(50);
        timeService.markAsStart();

        lifecycleEvents = new LifecycleEventsImpl();
        metricsService = new MetricsService(lifecycleEvents, logger);

        dateService.addSeconds(200);
        new StartupMetricsService(metricsService, lifecycleEvents, timeService, dateService, '1.2.3');
    });

    it('should work and use construction uptime, not bootstrap uptime', async () => {
        expect(await metricsService.getMetrics()).to.equal('');

        dateService.addSeconds(50000);

        await lifecycleEvents.onBootstrapPostConstruct();

        expect(await metricsService.getMetrics()).to.equal(
            '# HELP akjs_startup_info Info on startup.\n' +
                '# TYPE akjs_startup_info gauge\n' +
                'akjs_startup_info{version="1.2.3"} 250000\n\n' +
                '# HELP akjs_process_start_time_seconds Start time of the process since unix epoch in seconds.\n' +
                '# TYPE akjs_process_start_time_seconds gauge\n' +
                'akjs_process_start_time_seconds 50\n',
        );

        await lifecycleEvents.onBootstrapPreDestroy();

        expect(logger.events).to.deep.equal([
            {
                msg: 'Added metric: akjs_startup_info: Info on startup.',
                arg: undefined,
                level: 'debug',
            },
            {
                msg:
                    'Added metric: akjs_process_start_time_seconds: Start time of the process since unix epoch in seconds.',
                arg: undefined,
                level: 'debug',
            },
        ]);
    });
});
