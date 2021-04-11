import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { FsModule } from './FsModule';

describe('FsModule', () => {
    testModuleResolvesAndBootstraps(FsModule);
});
