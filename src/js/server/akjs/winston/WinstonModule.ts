import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { Logger } from '../core/Logger';
import {
    WinstonLogger,
    ENV_CONSOLE_LOG_LEVEL,
    ENV_DEBUG_LOG_FILENAME,
    ENV_DEBUG_LOG_FILE_ENABLED,
    ENV_DEBUG_LOG_FILE_MAX_FILES,
    ENV_DEBUG_LOG_FILE_MAX_SIZE_M,
} from './WinstonLogger';

export const WinstonModule = new AkModule('akjs.winston', [CoreModule], (defs) =>
    defs
        .withClass({ provide: Logger, useClass: WinstonLogger })
        .withFactory(ENV_DEBUG_LOG_FILE_ENABLED.asFactoryProvider())
        .withFactory(ENV_DEBUG_LOG_FILE_MAX_SIZE_M.asFactoryProvider())
        .withFactory(ENV_DEBUG_LOG_FILE_MAX_FILES.asFactoryProvider())
        .withFactory(ENV_DEBUG_LOG_FILENAME.asFactoryProvider())
        .withFactory(ENV_CONSOLE_LOG_LEVEL.asFactoryProvider()),
);
