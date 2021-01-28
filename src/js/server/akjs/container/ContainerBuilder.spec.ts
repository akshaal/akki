/* eslint-disable @typescript-eslint/require-await */
import 'reflect-metadata';
import { AkModule } from './AkModule';
import { OnBootstrapPostConstruct } from './OnBootstrapPostConstruct';
import { OnBootstrapPreDestroy } from './OnBootstrapPreDestroy';
import { FactoryProvider } from './providers';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Subject } from 'rxjs';
import { TokenDescription } from './TokenDescription';
import { ContainerBuilder } from './ContainerBuilder';
import { Injector } from './Injector';
import { ContainerDescription } from './ContainerDescription';
import { ContainerShutdownInterface } from './ContainerShutdownInterface';
import { Scheduler } from '../core/Scheduler';
import { withPromiseTimeout } from '../misc/withPromiseTimeout';

chai.use(chaiAsPromised);

class Token1 {}

class Token2 extends Token1 implements OnBootstrapPostConstruct, OnBootstrapPreDestroy {
    public destroyed = false;
    public constructed = false;

    // eslint-disable-next-line @typescript-eslint/require-await
    public async onBootstrapPreDestroy(): Promise<void> {
        this.destroyed = true;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async onBootstrapPostConstruct(): Promise<void> {
        this.constructed = true;
    }
}

class Token3 extends Token1 {}

const EmptyModule = new AkModule('empty');

const SimpleModule = new AkModule('simple', (defs) => defs.with(Token1));

const BootstrapModule = new AkModule('bootstrap', (defs) => defs.bootstrap(Token1));

const Token2BootstrapModule = new AkModule('token2-bootstrap', (defs) => defs.bootstrap(Token2));

const BootstrapModule2 = new AkModule('bootstrap2', (defs) => defs.bootstrap(Token1, Token2));

const BootstrapModule3 = new AkModule('bootstrap3', [BootstrapModule2], (defs) => defs.bootstrap(Token2));

const BootstrapModule4 = new AkModule('bootstrap4', [BootstrapModule2], (defs) => defs.with(Token2));

const BootstrapUseExisting = new AkModule('bootstrap-use-existing', [BootstrapModule], (defs) =>
    defs.with(Token2).withExisting({ provide: Token1, useExisting: Token2 }),
);

const MultiModule1 = new AkModule('multi1', (defs) =>
    defs
        .withClass({ provide: Token3, useClass: Token3, multi: true })
        .withClass({ provide: Token3, useClass: Token3, multi: true }),
);

const MultiModule2 = new AkModule('multi2', [MultiModule1], (defs) =>
    defs.withClass({ provide: Token3, useClass: Token3, multi: true }),
);

const ModuleA = new AkModule('A');
const ModuleB = new AkModule('B', [ModuleA]);
const ModuleC = new AkModule('C', [ModuleA]);
const ModuleD = new AkModule('D', [ModuleB, ModuleC]);
const ModuleE = new AkModule('E', [ModuleC, ModuleB, ModuleD]);

const MultiBootstrapModule = new AkModule('multi10', (defs) =>
    defs
        .withClass({ provide: Token1, useClass: Token2, multi: true })
        .withClass({ provide: Token1, useClass: Token1, multi: true })
        .bootstrapClass({ provide: Token1, useClass: Token3, multi: true }),
);

const token2FactoryProvider: FactoryProvider<Token1, Token3> = {
    provide: Token1,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    useFactory: (_: Readonly<Token2>) => new Token3(),
    deps: [Token2],
};

const FactoryModule = new AkModule('factory', (defs) => defs.withFactory(token2FactoryProvider));

const FactoryBootModule = new AkModule('factory-boot', (defs) => defs.bootstrapFactory(token2FactoryProvider));

const Factory2Module = new AkModule('factory2', [FactoryModule], (defs) => defs.with(Token2));

class PreDestroyErroringClass implements OnBootstrapPreDestroy {
    public async onBootstrapPreDestroy(): Promise<void> {
        throw new Error('some error in onBootstrapPreDestroy..');
    }
}

class PreDestroyErroringClass2 implements OnBootstrapPreDestroy {
    public onBootstrapPreDestroy(): Promise<void> {
        throw new Error('some error in onBootstrapPreDestroy..');
    }
}

const ModuleWithPreDestroyError = new AkModule('error-on-pre-destroy', (defs) =>
    defs.bootstrap(PreDestroyErroringClass),
);

const ModuleWithPreDestroyError2 = new AkModule('error-on-pre-destroy2', (defs) =>
    defs.bootstrap(PreDestroyErroringClass2),
);

class DelayingClass implements OnBootstrapPreDestroy {
    public onBootstrapPreDestroy(): Promise<void> {
        return new Subject<void>().toPromise();
    }
}

const ModuleWithNeverFinishingDestroy = new AkModule('never-finishing-module', (defs) => defs.bootstrap(DelayingClass));

function filterOutStd(defs: Readonly<TokenDescription[]>): Readonly<TokenDescription[]> {
    return defs.filter(
        (def) =>
            def.name !== 'Injector' && def.name !== 'ContainerDescription' && def.name !== 'ContainerShutdownInterface',
    );
}

describe('ContainerBuilder', () => {
    it('works with an empty module', async () => {
        const container = await new ContainerBuilder(EmptyModule).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['empty']);
        expect(description.tokenDescriptions).to.deep.equal([
            {
                name: 'Injector',
                token: Injector,
                multi: false,
                bootstrap: false,
                moduleNames: [],
            },
            {
                name: 'ContainerDescription',
                token: ContainerDescription,
                multi: false,
                bootstrap: false,
                moduleNames: [],
            },
            {
                bootstrap: false,
                moduleNames: [],
                multi: false,
                name: 'ContainerShutdownInterface',
                token: ContainerShutdownInterface,
            },
        ]);
        await container.shutdown();
    });

    it('works with a simple module', async () => {
        const container = await new ContainerBuilder(SimpleModule).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['simple']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token1',
                token: Token1,
                multi: false,
                bootstrap: false,
                moduleNames: ['simple'],
            },
        ]);
        await container.shutdown();
    });

    it('works with a module with a bootstrap definition', async () => {
        const container = await new ContainerBuilder(BootstrapModule).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['bootstrap']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token1',
                token: Token1,
                multi: false,
                bootstrap: true,
                moduleNames: ['bootstrap'],
            },
        ]);
        await container.shutdown();
    });

    it('works with a module with two bootstrap definition', async () => {
        const container = await new ContainerBuilder(BootstrapModule2).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['bootstrap2']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token1',
                token: Token1,
                multi: false,
                bootstrap: true,
                moduleNames: ['bootstrap2'],
            },
            {
                name: 'Token2',
                token: Token2,
                multi: false,
                bootstrap: true,
                moduleNames: ['bootstrap2'],
            },
        ]);
        await container.shutdown();
    });

    it('overrides bootstrap defs from imports if needed', async () => {
        const container = await new ContainerBuilder(BootstrapModule3).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['bootstrap2', 'bootstrap3']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token1',
                token: Token1,
                multi: false,
                bootstrap: true,
                moduleNames: ['bootstrap2'],
            },
            {
                name: 'Token2',
                token: Token2,
                multi: false,
                bootstrap: true,
                moduleNames: ['bootstrap3'],
            },
        ]);
        await container.shutdown();
    });

    it('overrides bootstrap with not bootstrap defs', async () => {
        const container = await new ContainerBuilder(BootstrapModule4).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['bootstrap2', 'bootstrap4']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token1',
                token: Token1,
                multi: false,
                bootstrap: true,
                moduleNames: ['bootstrap2'],
            },
            {
                name: 'Token2',
                token: Token2,
                multi: false,
                bootstrap: false,
                moduleNames: ['bootstrap4'],
            },
        ]);
        await container.shutdown();
    });

    it('works with multi-provider modules', async () => {
        const container = await new ContainerBuilder(MultiModule1).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['multi1']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token3',
                token: Token3,
                multi: true,
                bootstrap: false,
                moduleNames: ['multi1', 'multi1'],
            },
        ]);
        await container.shutdown();
    });

    it('works with multi-provider modules defined in different modules', async () => {
        const container = await new ContainerBuilder(MultiModule2).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['multi1', 'multi2']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token3',
                token: Token3,
                multi: true,
                bootstrap: false,
                moduleNames: ['multi1', 'multi1', 'multi2'],
            },
        ]);
        await container.shutdown();
    });

    it('supports overriding bootstrap with useExisting provider', async () => {
        const container = await new ContainerBuilder(BootstrapUseExisting).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['bootstrap', 'bootstrap-use-existing']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token1',
                token: Token1,
                multi: false,
                bootstrap: false,
                moduleNames: ['bootstrap-use-existing'],
            },
            {
                name: 'Token2',
                token: Token2,
                multi: false,
                bootstrap: false,
                moduleNames: ['bootstrap-use-existing'],
            },
        ]);
        expect(container.injector.get(Token1)).to.deep.equal(container.injector.get(Token2));
        await container.shutdown();
    });

    it('properly flatten modules (1)', async () => {
        const container = await new ContainerBuilder(ModuleD).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['A', 'B', 'C', 'D']);
        await container.shutdown();
    });

    it('properly flatten modules (2)', async () => {
        const container = await new ContainerBuilder(ModuleE).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['A', 'C', 'B', 'D', 'E']);
        await container.shutdown();
    });

    it('supports bootstrap instances defined using multi-providers', async () => {
        const container = await new ContainerBuilder(MultiBootstrapModule).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['multi10']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token1',
                token: Token1,
                multi: true,
                bootstrap: true,
                moduleNames: ['multi10', 'multi10', 'multi10'],
            },
        ]);

        const constructedToken2 = new Token2();
        constructedToken2.constructed = true;

        const destroyedToken2 = new Token2();
        destroyedToken2.destroyed = true;
        destroyedToken2.constructed = true;

        const got = container.injector.getMulti(Token1);

        expect(got).to.deep.equal([constructedToken2, new Token1(), new Token3()]);

        await container.shutdown();

        expect(got).to.deep.equal([destroyedToken2, new Token1(), new Token3()]);
    });

    it('fails without a satisfied dependency in a provider (finishConstruction must succeed)', async () => {
        const container = await new ContainerBuilder(FactoryModule).finishConstruction();
        expect(() => {
            container.injector.get(Token1);
        }).to.throw('No provider for Token2');
    });

    it('fails without a satisfied dependency in a bootstrap (finishConstruction must not succeed)', async () => {
        await expect(new ContainerBuilder(FactoryBootModule).finishConstruction()).to.be.rejectedWith(
            'No provider for Token2',
        );
    });

    it('supports factories with OK dependencies', async () => {
        const container = await new ContainerBuilder(Factory2Module).finishConstruction();
        const { description } = container;
        expect(description.moduleNames).to.deep.equal(['factory', 'factory2']);
        expect(filterOutStd(description.tokenDescriptions)).to.deep.equal([
            {
                name: 'Token1',
                token: Token1,
                multi: false,
                bootstrap: false,
                moduleNames: ['factory'],
            },
            {
                name: 'Token2',
                token: Token2,
                multi: false,
                bootstrap: false,
                moduleNames: ['factory2'],
            },
        ]);
        await container.shutdown();
    });

    it("controls that mix of multi and regular providers doesn't work", () => {
        expect(() => {
            new ContainerBuilder(
                new AkModule('empty', (defs) =>
                    defs
                        .withValue({ provide: Token1, useValue: new Token1() })
                        .withValue({ provide: Token1, useValue: new Token1(), multi: true }),
                ),
            );
        }).to.throw('Cannot mix multi providers and regular providers');
    });

    it('rejects second attempt to finish construction of the same container', async () => {
        const builder = new ContainerBuilder(EmptyModule);

        await builder.finishConstruction();

        await expect(builder.finishConstruction()).to.be.rejectedWith('Already constructed or constructing');
    });

    it('allows calling shutdown multiple times on the container (unlike finishConstruction())', async () => {
        const builder = new ContainerBuilder(EmptyModule);

        const container = await builder.finishConstruction();

        await container.shutdown();

        await container.shutdown();
    });

    it('propagates an error in the shutdown process to the promise returned from shutdown() method of container', async () => {
        const builder = new ContainerBuilder(ModuleWithPreDestroyError);

        const container = await builder.finishConstruction();

        await expect(container.shutdown()).to.be.rejectedWith('some error in onBootstrapPreDestroy..');
    });

    it('propagates non-async error in the shutdown process to the promise returned from shutdown() method of container (2)', async () => {
        const builder = new ContainerBuilder(ModuleWithPreDestroyError2);

        const container = await builder.finishConstruction();

        await expect(container.shutdown()).to.be.rejectedWith('some error in onBootstrapPreDestroy..');
    });

    it('emits shutdown finished event when shutdown is finished (and before the shutdown promise is resolved)', async () => {
        const builder = new ContainerBuilder(EmptyModule);

        let finished = 0;

        const container = await builder.finishConstruction();
        container.shutdownFinished$.subscribe(() => {
            finished += 1;
        });

        expect(finished).to.be.equal(0);

        await container.shutdown();
        expect(finished).to.be.equal(1);
    });

    it('propagates an error in the shutdown process to the shutdownFinished$', async () => {
        const builder = new ContainerBuilder(ModuleWithPreDestroyError);

        const container = await builder.finishConstruction();
        const obsAsProm = container.shutdownFinished$.toPromise();

        await expect(container.shutdown()).to.be.rejectedWith('some error in onBootstrapPreDestroy..');
        await expect(obsAsProm).to.be.rejectedWith('some error in onBootstrapPreDestroy..');
    });

    it('propagates a non-async error in the shutdown process to the shutdownFinished$', async () => {
        const builder = new ContainerBuilder(ModuleWithPreDestroyError2);

        const container = await builder.finishConstruction();
        const obsAsProm = container.shutdownFinished$.toPromise();

        await expect(container.shutdown()).to.be.rejectedWith('some error in onBootstrapPreDestroy..');
        await expect(obsAsProm).to.be.rejectedWith('some error in onBootstrapPreDestroy..');
    });

    it('should finish bootstrap process before starting shutdown process even shutdown is requested during or before bootstrap', async () => {
        const builder = new ContainerBuilder(Token2BootstrapModule);

        builder.injector.get(ContainerShutdownInterface).requestShutdown();

        const token2 = builder.injector.get(Token2);
        expect(token2.constructed).to.be.equal(false);
        expect(token2.destroyed).to.be.equal(false);

        const container = await builder.finishConstruction();
        expect(token2.constructed).to.be.equal(true);

        await container.shutdownFinished$.toPromise();
        expect(token2.destroyed).to.be.equal(true);
    });

    it('should let implement shutdown with timeout if shutting down using container.shutdown()', async () => {
        const builder = new ContainerBuilder(ModuleWithNeverFinishingDestroy);
        const scheduler = new Scheduler();

        const container = await builder.finishConstruction({
            shutdownPromiseWrapper: (promise) =>
                withPromiseTimeout(promise, {
                    msg: 'Container shutdown',
                    seconds: 0.005,
                    scheduler,
                }),
        });

        await expect(container.shutdown()).to.be.rejectedWith('Timed out after 0.005 seconds.');
    });

    it('should let implement shutdown with timeout if shutting down using requestShutdown()', async () => {
        const builder = new ContainerBuilder(ModuleWithNeverFinishingDestroy);
        const scheduler = new Scheduler();

        const container = await builder.finishConstruction({
            shutdownPromiseWrapper: (promise) =>
                withPromiseTimeout(promise, {
                    msg: 'Container shutdown',
                    seconds: 0.005,
                    scheduler,
                }),
        });

        builder.injector.get(ContainerShutdownInterface).requestShutdown();

        await expect(container.shutdownFinished$.toPromise()).to.be.rejectedWith('Timed out after 0.005 seconds.');
    });
});
