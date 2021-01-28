/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable require-atomic-updates */

import { expect } from 'chai';
import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { LoggerForTest } from '../core/LoggerForTest';
import { MetricsService } from '../metrics/MetricsService';
import { PerformanceObserverFactory } from '../process/PerformanceObserverFactory';
import { GcMetricsService } from './GcMetricsService';
import perfHooks from 'perf_hooks';

describe('StartupMetricsService', () => {
    let logger: LoggerForTest;
    let lifecycleEvents: LifecycleEventsImpl;
    let metricsService: MetricsService;
    let performanceObserverFactoryMock: PerformanceObserverFactory;

    beforeEach(() => {
        logger = new LoggerForTest();
        lifecycleEvents = new LifecycleEventsImpl();
        metricsService = new MetricsService(lifecycleEvents, logger);
        performanceObserverFactoryMock = mock(PerformanceObserverFactory);
        new GcMetricsService(metricsService, lifecycleEvents, instance(performanceObserverFactoryMock));
    });

    it('should work', async () => {
        expect(await metricsService.getMetrics()).to.equal('');

        const performanceObserverMock = mock(perfHooks.PerformanceObserver);
        const performanceObserver = instance(performanceObserverMock);

        when(performanceObserverFactoryMock.create(anything())).thenCall(() => performanceObserver);

        await lifecycleEvents.onBootstrapPostConstruct();

        verify(performanceObserverFactoryMock.create(anything())).once();
        const [cb] = capture(performanceObserverFactoryMock.create).last();

        verify(performanceObserverMock.observe(deepEqual({ entryTypes: ['gc'], buffered: false }))).once();

        const cbTyped: perfHooks.PerformanceObserverCallback = cb;

        const performanceObserverEntryListMock = mock<perfHooks.PerformanceObserverEntryList>();

        function notify(kind: number, duration: number): void {
            when(performanceObserverEntryListMock.getEntries()).thenReturn([
                {
                    name: 'x',
                    startTime: 2,
                    kind,
                    duration,
                    entryType: 'gc',
                },
            ]);

            cbTyped(instance(performanceObserverEntryListMock), performanceObserver);
        }

        notify(perfHooks.constants.NODE_PERFORMANCE_GC_MINOR, 12);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_MINOR, 5);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_MAJOR, 2);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_MAJOR, 4);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL, 5);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL, 9);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_WEAKCB, 5);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_WEAKCB, 7);

        expect(await metricsService.getMetrics()).to.equal(
            '# HELP akjs_nodejs_gc_duration_summary Summary of garbage collections. gc_type label is one of major, minor, incremental or weakcb.\n' +
                '# TYPE akjs_nodejs_gc_duration_summary summary\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="minor"} 0.0085\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="minor"} 0.012\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="minor"} 0.012\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="minor"} 0.012\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="minor"} 0.017\n' +
                'akjs_nodejs_gc_duration_summary_count{gc_type="minor"} 2\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="major"} 0.003\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="major"} 0.004\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="major"} 0.004\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="major"} 0.004\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="major"} 0.006\nakjs_nodejs_gc_duration_summary_count{gc_type="major"} 2\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="incremental"} 0.006999999999999999\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="incremental"} 0.009\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="incremental"} 0.009\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="incremental"} 0.009\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="incremental"} 0.013999999999999999\n' +
                'akjs_nodejs_gc_duration_summary_count{gc_type="incremental"} 2\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="weakcb"} 0.006\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="weakcb"} 0.007\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="weakcb"} 0.007\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="weakcb"} 0.007\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="weakcb"} 0.012\n' +
                'akjs_nodejs_gc_duration_summary_count{gc_type="weakcb"} 2\n',
        );

        notify(perfHooks.constants.NODE_PERFORMANCE_GC_MINOR, 1);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_MINOR, 2);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_MAJOR, 9);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_MAJOR, 3);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL, 2);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL, 1);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_WEAKCB, 57);
        notify(perfHooks.constants.NODE_PERFORMANCE_GC_WEAKCB, 4);
        notify(666, 4);

        expect(await metricsService.getMetrics()).to.equal(
            '# HELP akjs_nodejs_gc_duration_summary Summary of garbage collections. gc_type label is one of major, minor, incremental or weakcb.\n' +
                '# TYPE akjs_nodejs_gc_duration_summary summary\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="minor"} 0.0035\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="minor"} 0.0085\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="minor"} 0.012\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="minor"} 0.012\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="minor"} 0.020000000000000004\n' +
                'akjs_nodejs_gc_duration_summary_count{gc_type="minor"} 4\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="major"} 0.0035\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="major"} 0.0065\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="major"} 0.009\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="major"} 0.009\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="major"} 0.018\n' +
                'akjs_nodejs_gc_duration_summary_count{gc_type="major"} 4\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="incremental"} 0.0035\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="incremental"} 0.006999999999999999\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="incremental"} 0.009\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="incremental"} 0.009\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="incremental"} 0.017\n' +
                'akjs_nodejs_gc_duration_summary_count{gc_type="incremental"} 4\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="weakcb"} 0.006\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="weakcb"} 0.032\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="weakcb"} 0.057\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="weakcb"} 0.057\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="weakcb"} 0.07300000000000001\n' +
                'akjs_nodejs_gc_duration_summary_count{gc_type="weakcb"} 4\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.5",gc_type="unknown"} 0.004\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.75",gc_type="unknown"} 0.004\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.9",gc_type="unknown"} 0.004\n' +
                'akjs_nodejs_gc_duration_summary{quantile="0.99",gc_type="unknown"} 0.004\n' +
                'akjs_nodejs_gc_duration_summary_sum{gc_type="unknown"} 0.004\n' +
                'akjs_nodejs_gc_duration_summary_count{gc_type="unknown"} 1\n',
        );

        await lifecycleEvents.onBootstrapPreDestroy();

        expect(logger.events).to.deep.equal([
            {
                msg:
                    'Added metric: akjs_nodejs_gc_duration_summary: Summary of garbage collections. gc_type label is one of major, minor, incremental or weakcb.',
                arg: undefined,
                level: 'debug',
            },
        ]);
    });
});
