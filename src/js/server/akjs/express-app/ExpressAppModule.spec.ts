import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { ENV_HTTP_SERVER_BIND_PORT } from '../express/ExpressServer';
import { ExpressAppModule } from './ExpressAppModule';

describe('ExpressAppModule', () => {
    testModuleResolvesAndBootstraps(ExpressAppModule, (defs) =>
        defs.withValue({ provide: ENV_HTTP_SERVER_BIND_PORT, useValue: '0' }),
    );
});
