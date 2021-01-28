import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { CoreModule } from './CoreModule';

describe('CoreModule', () => {
    testModuleResolvesAndBootstraps(CoreModule);
});
