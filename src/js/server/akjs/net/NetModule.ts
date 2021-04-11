import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { SocketObservablesService } from './SocketObservablesService';

export const NetModule = new AkModule('akjs.net', [CoreModule], (defs) => defs.with(SocketObservablesService));
