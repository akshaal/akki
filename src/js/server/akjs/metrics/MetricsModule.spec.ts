import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { MetricsModule } from './MetricsModule';

describe('MetricsModule', () => {
    testModuleResolvesAndBootstraps(MetricsModule);
});
