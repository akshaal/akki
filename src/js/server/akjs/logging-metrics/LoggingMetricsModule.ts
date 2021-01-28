import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { MetricsModule } from '../metrics/MetricsModule';
import { LoggingMetricsService } from './LoggingMetricsService';

export const LoggingMetricsModule = new AkModule('akjs.logging_metrics', [CoreModule, MetricsModule], (defs) =>
    defs.bootstrap(LoggingMetricsService),
);
