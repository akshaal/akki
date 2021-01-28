import { expect } from 'chai';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { LoggerForTest } from '../core/LoggerForTest';
import { MetricsService } from '../metrics/MetricsService';
import { LoggingMetricsService } from './LoggingMetricsService';

describe('LoggingMetricsService', () => {
    let logger: LoggerForTest;
    let lifecycleEvents: LifecycleEventsImpl;
    let metricsService: MetricsService;

    beforeEach(() => {
        logger = new LoggerForTest();

        lifecycleEvents = new LifecycleEventsImpl();
        metricsService = new MetricsService(lifecycleEvents, logger);

        new LoggingMetricsService(metricsService, lifecycleEvents, logger);
    });

    it('should work', async () => {
        expect(await metricsService.getMetrics()).to.equal('');

        await lifecycleEvents.onBootstrapPostConstruct();

        expect(logger.events).to.be.deep.equal([
            {
                msg: 'Added metric: akjs_logging_count: Number of log messages.',
                arg: undefined,
                level: 'debug',
            },
        ]);

        const m1 = await metricsService.getMetrics();
        expect(m1).contains('akjs_logging_count{level="debug"} 1\n');
        expect(m1).contains('akjs_logging_count{level="info"} 0\n');
        expect(m1).contains('akjs_logging_count{level="error"} 0\n');
        expect(m1).contains('akjs_logging_count{level="warning"} 0\n');

        logger.warn('x');
        logger.warn('y');
        logger.error('y2');
        logger.error('y3');
        logger.error('y4');
        logger.info('123');
        logger.info('123');
        logger.info('123');
        logger.info('123');

        const m2 = await metricsService.getMetrics();
        expect(m2).contains('akjs_logging_count{level="debug"} 1\n');
        expect(m2).contains('akjs_logging_count{level="info"} 4\n');
        expect(m2).contains('akjs_logging_count{level="error"} 3\n');
        expect(m2).contains('akjs_logging_count{level="warning"} 2\n');

        await lifecycleEvents.onBootstrapPreDestroy();

        logger.warn('x');
        logger.error('y2');
        logger.info('123');
        logger.debug('123');

        const m3 = await metricsService.getMetrics();
        expect(m3).to.be.equal('');
    });
});
