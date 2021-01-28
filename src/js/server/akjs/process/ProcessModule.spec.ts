import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { ProcessModule } from './ProcessModule';

describe('ProcessModule', () => {
    testModuleResolvesAndBootstraps(ProcessModule);
});
