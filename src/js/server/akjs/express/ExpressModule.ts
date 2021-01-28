import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { ExpressServer, ENV_HTTP_SERVER_BIND_HOST, ENV_HTTP_SERVER_BIND_PORT } from './ExpressServer';

export const ExpressModule = new AkModule('akjs.express', [CoreModule], (defs) =>
    defs
        .withFactory(ENV_HTTP_SERVER_BIND_HOST.asFactoryProvider())
        .withFactory(ENV_HTTP_SERVER_BIND_PORT.asFactoryProvider())
        .bootstrap(ExpressServer),
);
