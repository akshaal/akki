import { Injectable } from 'injection-js';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { MetricsService } from '../metrics/MetricsService';
import { MemoryUsageService } from '../process/MemoryUsageService';

@Injectable()
export class MemoryMetricsService {
    public constructor(
        metricsService: MetricsService,
        lifecycleEvents: LifecycleEvents,
        memoryUsageService: MemoryUsageService,
    ) {
        lifecycleEvents.postConstruct$.subscribe(() => {
            const residentGauge = metricsService.createGauge({
                name: 'akjs_process_resident_memory_bytes',
                help: 'Resident memory size in bytes.',
            });

            const heapTotalGauge = metricsService.createGauge({
                name: 'akjs_process_heap_total_bytes',
                help: 'Total heap memory size in bytes.',
            });

            const heapUsedGauge = metricsService.createGauge({
                name: 'akjs_process_heap_used_bytes',
                help: 'Used heap memory size in bytes.',
            });

            const externalGauge = metricsService.createGauge({
                name: 'akjs_process_external_memory_bytes',
                help: 'Used heap memory size in bytes.',
            });

            metricsService.update$.pipe(lifecycleEvents.takeUntilDestroyed()).subscribe(() => {
                const memUsage = memoryUsageService.get();
                residentGauge.set(memUsage.rss);
                heapTotalGauge.set(memUsage.heapTotal);
                heapUsedGauge.set(memUsage.heapUsed);
                externalGauge.set(memUsage.external);
            });
        });
    }
}
