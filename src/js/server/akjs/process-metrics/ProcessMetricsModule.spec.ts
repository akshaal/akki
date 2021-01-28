import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { ProcessMetricsModule } from './ProcessMetricsModule';

describe('ProcessMetricsModule', () => {
    testModuleResolvesAndBootstraps(ProcessMetricsModule);
});
