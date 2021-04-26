import { testModuleResolvesAndBootstraps } from 'server/akjs/container/testModuleResolvesAndBootstraps';
import { ENV_HTTP_SERVER_BIND_PORT } from 'server/akjs/express/ExpressServer';
import { KlipperModule } from './KlipperModule';

describe('KlipperModule', () => {
    testModuleResolvesAndBootstraps(KlipperModule, (defs) =>
        defs.withValue({ provide: ENV_HTTP_SERVER_BIND_PORT, useValue: '0' }),
    );
});
