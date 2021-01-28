import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { DebugModule } from './DebugModule';

describe('DebugModule', () => {
    testModuleResolvesAndBootstraps(DebugModule);
});
