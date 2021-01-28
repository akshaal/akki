import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { NodeJsAppModule } from './NodeJsAppModule';

describe('NodeJsAppModule', () => {
    testModuleResolvesAndBootstraps(NodeJsAppModule);
});
