/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { expect } from 'chai';
import { AkModule } from '../container/AkModule';
import { ContainerBuilder } from '../container/ContainerBuilder';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { Logger } from '../core/Logger';
import { LoggerForTest } from '../core/LoggerForTest';
import { ContainerDescriptionDumper } from './ContainerDescriptionDumper';

class A {}
class B {}
class C {}

const XModule = new AkModule('x', (defs) =>
    defs
        .bootstrap(B, ContainerDescriptionDumper)
        .with(A)
        .withClass({ provide: Logger, useClass: LoggerForTest })
        .withClass({ provide: LifecycleEvents, useClass: LifecycleEventsImpl }),
);
const YModule = new AkModule('y', [XModule], (defs) => defs.bootstrap(B).with(A));
const ZModule = new AkModule('z', [XModule], (defs) => defs.withClass({ provide: C, useClass: C, multi: true }));
const JustModule = new AkModule('j', [YModule, ZModule]);

describe('ContainerDescriptionDumper', () => {
    it('should work', async () => {
        const containerBuilder = new ContainerBuilder(JustModule);
        const container = await containerBuilder.finishConstruction();
        const logger = container.injector.get(Logger) as LoggerForTest;

        expect(logger.events).to.be.deep.equal([
            {
                msg:
                    'Modules are resolved in the following order and provided the following tokens:\n' +
                    '    x: ContainerDescriptionDumper [B], LifecycleEvents, Logger\n' +
                    '    y: A, B [B]\n' +
                    '    z: C [M]\n' +
                    '    j: <nothing>',
                arg: undefined,
                level: 'debug',
            },
        ]);

        expect(logger.debugEventsLogged).to.be.equal(1);
    });

    it('should not waste time creating debug message if debug disabled', async () => {
        const containerBuilder = new ContainerBuilder(JustModule);

        const logger = containerBuilder.injector.get(Logger) as LoggerForTest;
        logger.debugEnabled = false;

        await containerBuilder.finishConstruction();

        expect(logger.events).to.be.deep.equal([]);
        expect(logger.debugEventsLogged).to.be.equal(0);
    });
});
