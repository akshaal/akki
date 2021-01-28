import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { LoggingMetricsModule } from './LoggingMetricsModule';

describe('LoggingMetricsModule', () => {
    testModuleResolvesAndBootstraps(LoggingMetricsModule);
});
