import { expect } from 'chai';
import 'reflect-metadata';
import { mock, when, instance, reset } from 'ts-mockito';
import { CpuUsageService } from '../process/CpuUsageService';
import { TimeServiceForTest } from '../process/TimeServiceForTest';
import { CpuMetricsService } from './CpuMetricsService';
import { MetricsService } from '../metrics/MetricsService';
import { LoggerForTest } from '../core/LoggerForTest';
import { DateServiceForTest } from '../core/DateServiceForTest';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';

describe('CpuMetricsService', () => {
    let logger: LoggerForTest;
    let lifecycleEvents: LifecycleEventsImpl;
    let metricsService: MetricsService;
    let dateService: DateServiceForTest;
    let timeService: TimeServiceForTest;
    let cpuUsageServiceMock: CpuUsageService;

    beforeEach(() => {
        logger = new LoggerForTest();
        dateService = new DateServiceForTest();
        timeService = new TimeServiceForTest(dateService);
        dateService.addSeconds(100);
        timeService.markAsStart();

        lifecycleEvents = new LifecycleEventsImpl();
        metricsService = new MetricsService(lifecycleEvents, logger);
        cpuUsageServiceMock = mock<CpuUsageService>();

        new CpuMetricsService(metricsService, lifecycleEvents, timeService, instance(cpuUsageServiceMock));
    });

    it('should work', async () => {
        expect(await metricsService.getMetrics()).to.equal('');

        when(cpuUsageServiceMock.get()).thenReturn({ user: 1000, system: 200 });

        await lifecycleEvents.onBootstrapPostConstruct();

        dateService.addSeconds(15);
        reset(cpuUsageServiceMock);
        when(cpuUsageServiceMock.get()).thenReturn({ user: 151000, system: 75200 });

        const m1 = await metricsService.getMetrics();
        expect(m1).to.contain('akjs_process_cpu_user_pct 1\n');
        expect(m1).to.contain('akjs_process_cpu_system_pct 0.5\n');

        dateService.addSeconds(15);

        const m2 = await metricsService.getMetrics();
        expect(m2).to.contain('akjs_process_cpu_user_pct 0\n');
        expect(m2).to.contain('akjs_process_cpu_system_pct 0\n');

        dateService.addSeconds(10);
        reset(cpuUsageServiceMock);
        when(cpuUsageServiceMock.get()).thenReturn({ user: 151100, system: 75210 });

        const m3 = await metricsService.getMetrics();
        expect(m3).to.contain('akjs_process_cpu_user_pct 0.001\n');
        expect(m3).to.contain('akjs_process_cpu_system_pct 0.0001\n');

        await lifecycleEvents.onBootstrapPreDestroy();

        dateService.addSeconds(10);
        reset(cpuUsageServiceMock);
        when(cpuUsageServiceMock.get()).thenReturn({ user: 251100, system: 175210 });

        const m4 = await metricsService.getMetrics();
        expect(m4).to.equal('');

        expect(logger.events).to.deep.equal([
            {
                msg: 'Added metric: akjs_process_cpu_user_pct: User CPU time by node process.',
                arg: undefined,
                level: 'debug',
            },
            {
                msg: 'Added metric: akjs_process_cpu_system_pct: System CPU time by node process.',
                arg: undefined,
                level: 'debug',
            },
        ]);
    });
});
