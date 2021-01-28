import perfHooks from 'perf_hooks';
import { Injectable } from 'injection-js';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { MetricsService } from '../metrics/MetricsService';
import { PerformanceObserverFactory } from '../process/PerformanceObserverFactory';

const L_GC_TYPE = 'gc_type';

function gcKindToString(gcKind: number | undefined): string {
    let gcKindName = '';

    switch (gcKind) {
        case perfHooks.constants.NODE_PERFORMANCE_GC_MAJOR:
            gcKindName = 'major';
            break;
        case perfHooks.constants.NODE_PERFORMANCE_GC_MINOR:
            gcKindName = 'minor';
            break;
        case perfHooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL:
            gcKindName = 'incremental';
            break;
        case perfHooks.constants.NODE_PERFORMANCE_GC_WEAKCB:
            gcKindName = 'weakcb';
            break;
        default:
            gcKindName = 'unknown';
            break;
    }

    return gcKindName;
}

@Injectable()
export class GcMetricsService {
    public constructor(
        metricsService: MetricsService,
        lifecycleEvents: LifecycleEvents,
        performanceObserverFactory: PerformanceObserverFactory,
    ) {
        lifecycleEvents.postConstruct$.subscribe(() => {
            const summary = metricsService.createSummary({
                name: 'akjs_nodejs_gc_duration_summary',
                help: 'Summary of garbage collections. gc_type label is one of major, minor, incremental or weakcb.',
                labelNames: [L_GC_TYPE],
                maxAgeSeconds: 600,
                ageBuckets: 5,
                percentiles: [0.5, 0.75, 0.9, 0.99],
            });

            const gcObserver = performanceObserverFactory.create((list) => {
                const [entry] = list.getEntries();
                const labels = { [L_GC_TYPE]: gcKindToString(entry.kind) };
                summary.observe(labels, entry.duration / 1000);
            });

            gcObserver.observe({ entryTypes: ['gc'], buffered: false });

            lifecycleEvents.preDestroy$.subscribe(() => {
                gcObserver.disconnect();
            });
        });
    }
}
