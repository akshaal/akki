import { AkModule } from '../container/AkModule';
import { NanoIdService } from './NanoIdService';

export const NanoIdModule = new AkModule('akjs.nanoid', (defs) => defs.with(NanoIdService));
