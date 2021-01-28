import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { ENV_SHUTDOWN_TIMEOUT_SECONDS, ENV_STARTUP_TIMEOUT_SECONDS } from './env_tokens';

export const NodeJsAppModule = new AkModule('akjs.nodejs_app', [CoreModule], (defs) =>
    defs
        .withFactory(ENV_SHUTDOWN_TIMEOUT_SECONDS.asFactoryProvider())
        .withFactory(ENV_STARTUP_TIMEOUT_SECONDS.asFactoryProvider()),
);
