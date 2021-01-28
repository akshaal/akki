import { expect } from 'chai';
import { Logger } from '../core/Logger';
import { LoggerForTest } from '../core/LoggerForTest';
import { AkModule, AKModuleBuildingCallback } from './AkModule';
import { AkModuleBuilder } from './AkModuleBuilder';
import { ContainerBuilder } from './ContainerBuilder';
import { ContainerDescription } from './ContainerDescription';

export function testModuleResolvesAndBootstraps(
    module: AkModule,
    cbk: AKModuleBuildingCallback = (defs): AkModuleBuilder => defs,
): void {
    const m = new AkModule('test', [module], (defs) =>
        cbk(defs.withClass({ provide: Logger, useClass: LoggerForTest })),
    );

    it('should resolve, bootstrap and shutdown', async () => {
        const container = await new ContainerBuilder(m).finishConstruction();

        try {
            container.description.tokenDescriptions.forEach((desc) => container.injector.getAsArray(desc.token));
        } finally {
            await container.shutdown();
        }
    });

    it('should not have duplicated module names', () => {
        const cb = new ContainerBuilder(m);
        const description = cb.injector.get(ContainerDescription);
        const namesSet = new Set(description.moduleNames);
        expect(namesSet.size).to.be.equal(description.moduleNames.length);
    });
}
