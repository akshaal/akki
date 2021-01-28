import { expect } from 'chai';
import { instance, mock, when } from 'ts-mockito';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { LoggerForTest } from '../core/LoggerForTest';
import { MetricsService } from '../metrics/MetricsService';
import { MemoryUsageService } from '../process/MemoryUsageService';
import { MemoryMetricsService } from './MemoryMetricsService';

describe('MemoryMetricsService', () => {
    let logger: LoggerForTest;
    let lifecycleEvents: LifecycleEventsImpl;
    let metricsService: MetricsService;
    let memoryUsageServiceMock: MemoryUsageService;

    beforeEach(() => {
        logger = new LoggerForTest();

        lifecycleEvents = new LifecycleEventsImpl();
        metricsService = new MetricsService(lifecycleEvents, logger);
        memoryUsageServiceMock = mock(MemoryUsageService);

        new MemoryMetricsService(metricsService, lifecycleEvents, instance(memoryUsageServiceMock));
    });

    it('should work and use construction uptime, not bootstrap uptime', async () => {
        expect(await metricsService.getMetrics()).to.equal('');

        when(memoryUsageServiceMock.get()).thenReturn({
            rss: 1020,
            heapTotal: 1560,
            heapUsed: 22020,
            external: 2100,
            arrayBuffers: 4200,
        });

        await lifecycleEvents.onBootstrapPostConstruct();

        expect(await metricsService.getMetrics()).to.equal(
            '# HELP akjs_process_resident_memory_bytes Resident memory size in bytes.\n' +
                '# TYPE akjs_process_resident_memory_bytes gauge\n' +
                'akjs_process_resident_memory_bytes 1020\n\n' +
                '# HELP akjs_process_heap_total_bytes Total heap memory size in bytes.\n' +
                '# TYPE akjs_process_heap_total_bytes gauge\n' +
                'akjs_process_heap_total_bytes 1560\n\n' +
                '# HELP akjs_process_heap_used_bytes Used heap memory size in bytes.\n' +
                '# TYPE akjs_process_heap_used_bytes gauge\n' +
                'akjs_process_heap_used_bytes 22020\n\n' +
                '# HELP akjs_process_external_memory_bytes Used heap memory size in bytes.\n' +
                '# TYPE akjs_process_external_memory_bytes gauge\n' +
                'akjs_process_external_memory_bytes 2100\n',
        );

        when(memoryUsageServiceMock.get()).thenReturn({
            rss: 1040,
            heapTotal: 1561,
            heapUsed: 22022,
            external: 2140,
            arrayBuffers: 4240,
        });

        expect(await metricsService.getMetrics()).to.equal(
            '# HELP akjs_process_resident_memory_bytes Resident memory size in bytes.\n' +
                '# TYPE akjs_process_resident_memory_bytes gauge\n' +
                'akjs_process_resident_memory_bytes 1040\n\n' +
                '# HELP akjs_process_heap_total_bytes Total heap memory size in bytes.\n' +
                '# TYPE akjs_process_heap_total_bytes gauge\n' +
                'akjs_process_heap_total_bytes 1561\n\n' +
                '# HELP akjs_process_heap_used_bytes Used heap memory size in bytes.\n' +
                '# TYPE akjs_process_heap_used_bytes gauge\n' +
                'akjs_process_heap_used_bytes 22022\n\n' +
                '# HELP akjs_process_external_memory_bytes Used heap memory size in bytes.\n' +
                '# TYPE akjs_process_external_memory_bytes gauge\n' +
                'akjs_process_external_memory_bytes 2140\n',
        );

        await lifecycleEvents.onBootstrapPreDestroy();

        expect(logger.events).to.deep.equal([
            {
                msg: 'Added metric: akjs_process_resident_memory_bytes: Resident memory size in bytes.',
                arg: undefined,
                level: 'debug',
            },
            {
                msg: 'Added metric: akjs_process_heap_total_bytes: Total heap memory size in bytes.',
                arg: undefined,
                level: 'debug',
            },
            {
                msg: 'Added metric: akjs_process_heap_used_bytes: Used heap memory size in bytes.',
                arg: undefined,
                level: 'debug',
            },
            {
                msg: 'Added metric: akjs_process_external_memory_bytes: Used heap memory size in bytes.',
                arg: undefined,
                level: 'debug',
            },
        ]);
    });
});
