import { AkModule } from '../container/AkModule';
import { FsTempService } from './FsTempService';

export const FsModule = new AkModule('akjs.fs', (defs) => defs.with(FsTempService));
