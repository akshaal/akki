import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { NetModule } from './NetModule';

describe('NetModule', () => {
    testModuleResolvesAndBootstraps(NetModule);
});
