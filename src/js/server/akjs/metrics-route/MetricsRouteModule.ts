import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { ExpressModule } from '../express/ExpressModule';
import { RouteMounter } from '../express/RouteMounter';
import { MetricsModule } from '../metrics/MetricsModule';
import { MetricsRouteMounter } from './MetricsRouteMounter';

export const MetricsRouteModule = new AkModule(
    'akjs.metrics_route',
    [CoreModule, MetricsModule, ExpressModule],
    (defs) => defs.withClass({ provide: RouteMounter, useClass: MetricsRouteMounter, multi: true }),
);
