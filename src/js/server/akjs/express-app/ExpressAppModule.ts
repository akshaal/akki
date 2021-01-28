import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { DebugModule } from '../debug/DebugModule';
import { ExpressModule } from '../express/ExpressModule';
import { LoggingMetricsModule } from '../logging-metrics/LoggingMetricsModule';
import { MetricsRouteModule } from '../metrics-route/MetricsRouteModule';
import { MetricsModule } from '../metrics/MetricsModule';
import { NodeJsAppModule } from '../nodejs-app/NodeJsAppModule';
import { ProcessMetricsModule } from '../process-metrics/ProcessMetricsModule';
import { ProcessModule } from '../process/ProcessModule';
import { WinstonModule } from '../winston/WinstonModule';

export const ExpressAppModule = new AkModule('akjs.express_app', [
    CoreModule,
    ExpressModule,
    MetricsModule,
    LoggingMetricsModule,
    MetricsModule,
    MetricsRouteModule,
    ProcessModule,
    ProcessMetricsModule,
    WinstonModule,
    DebugModule,
    NodeJsAppModule,
]);
