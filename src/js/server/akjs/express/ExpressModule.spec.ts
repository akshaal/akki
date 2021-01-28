import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { ExpressModule } from './ExpressModule';
import { ENV_HTTP_SERVER_BIND_PORT } from './ExpressServer';

describe('ExpressModule', () => {
    testModuleResolvesAndBootstraps(ExpressModule, (defs) =>
        defs.withValue({ provide: ENV_HTTP_SERVER_BIND_PORT, useValue: '0' }),
    );
});
