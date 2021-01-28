import { AkModule } from '../container/AkModule';
import { CpuUsageService } from './CpuUsageService';
import { MemoryUsageService } from './MemoryUsageService';
import { PerformanceObserverFactory } from './PerformanceObserverFactory';
import { TimeService } from './TimeService';

export const ProcessModule = new AkModule('akjs.process', (defs) =>
    defs.with(CpuUsageService, MemoryUsageService, TimeService, PerformanceObserverFactory),
);
