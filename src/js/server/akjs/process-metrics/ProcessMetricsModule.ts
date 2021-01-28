import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { MetricsModule } from '../metrics/MetricsModule';
import { ProcessModule } from '../process/ProcessModule';
import { CpuMetricsService } from './CpuMetricsService';
import { EventLoopMetricsService, ENV_EVENT_LOOP_MONITORING_RESOLUTION_MS } from './EventLoopMetricsService';
import { GcMetricsService } from './GcMetricsService';
import { MemoryMetricsService } from './MemoryMetricsService';
import { StartupMetricsService } from './StartupMetricsService';

export const ProcessMetricsModule = new AkModule(
    'akjs.process_metrics',
    [CoreModule, ProcessModule, MetricsModule],
    (defs) =>
        defs
            .bootstrap(
                CpuMetricsService,
                EventLoopMetricsService,
                GcMetricsService,
                MemoryMetricsService,
                StartupMetricsService,
            )
            .withFactory(ENV_EVENT_LOOP_MONITORING_RESOLUTION_MS.asFactoryProvider()),
);
