import { AkModule } from '../container/AkModule';
import { ConsoleLogger } from './ConsoleLogger';
import { DateService } from './DateService';
import { DelayedLogger } from './DelayedLogger';
import { EnvTokenResolver } from './EnvTokenResolver';
import { ENV_APP_VERSION } from './env_tokens';
import { LifecycleEvents } from './LifecycleEvents';
import { LifecycleEventsImpl } from './LifecycleEventsImpl';
import { Logger } from './Logger';
import { Scheduler } from './Scheduler';

export const CoreModule = new AkModule('akjs.core', (defs) =>
    defs
        .withClass({ provide: Logger, useClass: ConsoleLogger })
        .with(EnvTokenResolver, DateService, Scheduler)
        .withFactory(ENV_APP_VERSION.asFactoryProvider())
        .bootstrapClass({ provide: LifecycleEvents, useClass: LifecycleEventsImpl })
        .bootstrap(DelayedLogger),
);
