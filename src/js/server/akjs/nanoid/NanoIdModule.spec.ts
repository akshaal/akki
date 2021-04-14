import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { NanoIdModule } from './NanoIdModule';

describe('NanoIdModule', () => {
    testModuleResolvesAndBootstraps(NanoIdModule);
});
