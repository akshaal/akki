import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { ContainerDescriptionDumper } from './ContainerDescriptionDumper';
import { DebugEventBus } from './DebugEventBus';
import { EnvTokensDumper } from './EnvTokensDumper';

export const DebugModule = new AkModule('akjs.debug', [CoreModule], (defs) =>
    defs.bootstrap(EnvTokensDumper, ContainerDescriptionDumper).with(DebugEventBus),
);
