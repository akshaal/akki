import { testModuleResolvesAndBootstraps } from '../container/testModuleResolvesAndBootstraps';
import { WinstonModule } from './WinstonModule';

describe('WinstonModule', () => {
    testModuleResolvesAndBootstraps(WinstonModule);
});
