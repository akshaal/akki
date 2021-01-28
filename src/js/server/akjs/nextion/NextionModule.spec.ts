import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { NextionModule } from './NextionModule';

describe('NextionModule', () => {
    testModuleResolvesAndBootstraps(NextionModule);
});
