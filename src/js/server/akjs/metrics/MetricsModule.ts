import { AkModule } from '../container/AkModule';
import { CoreModule } from '../core/CoreModule';
import { MetricsService } from './MetricsService';

export const MetricsModule = new AkModule('akjs.metrics', [CoreModule], (defs) => defs.with(MetricsService));
