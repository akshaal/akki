import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { ENV_HTTP_SERVER_BIND_PORT } from '../express/ExpressServer';
import { MetricsRouteModule } from './MetricsRouteModule';

describe('MetricsRouteModule', () => {
    testModuleResolvesAndBootstraps(MetricsRouteModule, (defs) =>
        defs.withValue({ provide: ENV_HTTP_SERVER_BIND_PORT, useValue: '0' }),
    );
});
