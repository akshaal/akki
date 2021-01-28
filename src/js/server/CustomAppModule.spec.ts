import { testModuleResolvesAndBootstraps } from './akjs/container/testModuleResolvesAndBootstraps';
import { ENV_HTTP_SERVER_BIND_PORT } from './akjs/express/ExpressServer';
import { CustomAppModule } from './CustomAppModule';

describe('CustomAppModule', () => {
    testModuleResolvesAndBootstraps(CustomAppModule, (defs) =>
        defs.withValue({ provide: ENV_HTTP_SERVER_BIND_PORT, useValue: '0' }),
    );
});
