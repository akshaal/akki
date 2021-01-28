import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { DebugModule } from '../debug/DebugModule';
import {
    NextionDisplayService,
    ENV_NEXTION_PORT,
    ENV_NEXTION_DISPLAY_AUTO_REFRESH_DELAY_MS,
    ENV_NEXTION_PORT_AUTO_REOPEN_DELAY_MS,
} from './NextionDisplayService';

export const NextionModule = new AkModule('akjs.nextion', [CoreModule, DebugModule], (defs) =>
    defs
        .with(NextionDisplayService)
        .withFactory(ENV_NEXTION_PORT.asFactoryProvider())
        .withFactory(ENV_NEXTION_PORT_AUTO_REOPEN_DELAY_MS.asFactoryProvider())
        .withFactory(ENV_NEXTION_DISPLAY_AUTO_REFRESH_DELAY_MS.asFactoryProvider()),
);
