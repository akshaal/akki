/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { expect } from 'chai';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { instance, mock, verify, when } from 'ts-mockito';
import { AkModule } from '../container/AkModule';
import { ContainerShutdownInterface } from '../container/ContainerShutdownInterface';
import { OnBootstrapPostConstruct } from '../container/OnBootstrapPostConstruct';
import { OnBootstrapPreDestroy } from '../container/OnBootstrapPreDestroy';
import { ENV_APP_VERSION } from '../core/env_tokens';
import { Logger } from '../core/Logger';
import { LoggerForTest } from '../core/LoggerForTest';
import { Scheduler } from '../core/Scheduler';
import { hasProperty } from '../misc/hasProperty';
import { ENV_SHUTDOWN_TIMEOUT_SECONDS, ENV_STARTUP_TIMEOUT_SECONDS } from './env_tokens';
import { NodeJsApp } from './NodeJsApp';

const m1 = new AkModule('m1');

const m3 = new AkModule('m3', [m1], (defs) =>
    defs
        .with(LoggerForTest, Scheduler)
        .withExisting({ provide: Logger, useExisting: LoggerForTest })
        .withValue({ provide: ENV_APP_VERSION, useValue: '1.2.3' })
        .withValue({ provide: ENV_SHUTDOWN_TIMEOUT_SECONDS, useValue: '1' })
        .withValue({ provide: ENV_STARTUP_TIMEOUT_SECONDS, useValue: '1' }),
);

class ShutdownDelayingClass implements OnBootstrapPreDestroy {
    public onBootstrapPreDestroy(): Promise<void> {
        return new Subject<void>().toPromise();
    }
}

const m5shutdownDelaying = new AkModule('m5shutdown-delaying', [m3], (defs) =>
    defs.bootstrap(ShutdownDelayingClass).withValue({ provide: ENV_SHUTDOWN_TIMEOUT_SECONDS, useValue: '0.001' }),
);

class startupDelayingClass implements OnBootstrapPostConstruct {
    public onBootstrapPostConstruct(): Promise<void> {
        return new Subject<void>().toPromise();
    }
}

const m5startupDelaying = new AkModule('m5startup-delaying', [m3], (defs) =>
    defs.bootstrap(startupDelayingClass).withValue({ provide: ENV_STARTUP_TIMEOUT_SECONDS, useValue: '0.001' }),
);

class TestEnv {
    public readonly processMock: NodeJS.Process;
    public readonly process: NodeJS.Process;

    public constructor() {
        this.processMock = mock<NodeJS.Process>();
        this.process = instance(this.processMock);
    }
}

describe('NodeJsApp', () => {
    it('should delegate everything to runAsync() when run() is called', () => {
        let runAsyncCalled = false;
        const app = new NodeJsApp(m1, <any>666);
        app.runAsync = (): Promise<void> => {
            runAsyncCalled = true;
            return Promise.resolve();
        };

        app.run();

        expect(runAsyncCalled).to.be.equal(true);
    });

    it('must publish containerBuilderCreated$ and containerCreated$ event and be able to shutdown by request', async () => {
        const testEnv = new TestEnv();
        when(testEnv.processMock.env).thenReturn({ NODE_ENV: 'test' });

        const nodeJsApp = new NodeJsApp(m3, testEnv.process);
        await nodeJsApp.runAsync();

        // (could have also used containerCreated$, but using this to test containerBuilderCreated$ event)
        const injector = await nodeJsApp.containerBuilderCreated$.pipe(map((b) => b.injector)).toPromise();

        const shutdownFinished$ = await nodeJsApp.containerCreated$.pipe(map((b) => b.shutdownFinished$)).toPromise();

        injector.get(ContainerShutdownInterface).requestShutdown();
        await shutdownFinished$.toPromise();

        expect(injector.get(LoggerForTest).events).to.be.deep.equal([
            {
                msg: 'Started version 1.2.3 in test mode.',
                arg: undefined,
                level: 'info',
            },
            { msg: 'Stopped.', arg: undefined, level: 'info' },
        ]);

        verify(testEnv.processMock.exit(0)).once();
    });

    for (const signal of ['SIGINT', 'SIGUSR1', 'SIGUSR2']) {
        it(`must subscribe to ${signal} and handle the signal properly`, async () => {
            const listeners: any[] = [];

            const testEnv = new TestEnv();
            when(testEnv.processMock.env).thenReturn({ NODE_ENV: undefined });
            when(testEnv.processMock.on).thenReturn((_signal: any, listener: any) => {
                if (_signal == signal) {
                    listeners.push(listener);
                }
                return testEnv.process;
            });

            const nodeJsApp = new NodeJsApp(m3, testEnv.process);
            await nodeJsApp.runAsync();

            expect(listeners.length).to.be.equal(1);

            const container = await nodeJsApp.containerCreated$.toPromise();

            listeners.forEach((arg) => {
                arg(signal);
            });

            await container.shutdownFinished$.toPromise();

            expect(container.injector.get(LoggerForTest).events).to.be.deep.equal([
                {
                    msg: 'Started version 1.2.3 in unknown mode.',
                    arg: undefined,
                    level: 'info',
                },
                {
                    arg: undefined,
                    level: 'info',
                    msg: `Stopping gracefully: ${signal}.`,
                },
                { msg: 'Stopped.', arg: undefined, level: 'info' },
            ]);

            verify(testEnv.processMock.exit(0)).once();
        });
    }

    it('must handle timeouts during shutdown by request', async () => {
        const testEnv = new TestEnv();
        when(testEnv.processMock.env).thenReturn({ NODE_ENV: 'test' });

        const nodeJsApp = new NodeJsApp(m5shutdownDelaying, testEnv.process);
        await nodeJsApp.runAsync();

        // (could have also used containerCreated$, but using this to test containerBuilderCreated$ event)
        const injector = await nodeJsApp.containerBuilderCreated$.pipe(map((b) => b.injector)).toPromise();

        const shutdownFinished$ = await nodeJsApp.containerCreated$.pipe(map((b) => b.shutdownFinished$)).toPromise();

        injector.get(ContainerShutdownInterface).requestShutdown();

        await expect(shutdownFinished$.toPromise()).to.be.rejectedWith(
            'Container shutdown: Timed out after 0.001 seconds',
        );

        const events = injector.get(LoggerForTest).events.map((e) => {
            const { arg } = e;
            if (hasProperty(arg, 'error') && arg.error instanceof Error) {
                return { ...e, arg: arg.error.message };
            }
            return { ...e, arg: e.arg };
        });

        expect(events).to.be.deep.equal([
            {
                msg: 'Started version 1.2.3 in test mode.',
                arg: undefined,
                level: 'info',
            },
            {
                msg: 'Shutdown failure:',
                arg: 'Container shutdown: Timed out after 0.001 seconds.',
                level: 'info',
            },
        ]);

        verify(testEnv.processMock.exit(205)).once();
    });

    it(`must subscribe to unhandled rejections and handle them properly (exit by default)`, async () => {
        const listeners: any[] = [];

        const testEnv = new TestEnv();
        when(testEnv.processMock.on).thenReturn((_signal: any, listener: any) => {
            if (_signal == 'unhandledRejection') {
                listeners.push(listener);
            }
            return testEnv.process;
        });

        const nodeJsApp = new NodeJsApp(m3, testEnv.process);
        await nodeJsApp.runAsync();

        expect(listeners.length).to.be.equal(1);

        const aPromise = nodeJsApp.containerCreated$.toPromise();
        const injector = await nodeJsApp.containerBuilderCreated$.pipe(map((b) => b.injector)).toPromise();

        const error = new Error('test it error');
        listeners.forEach((arg) => {
            arg(error, aPromise);
        });

        expect(injector.get(LoggerForTest).events).to.be.deep.equal([
            {
                msg: 'Started version 1.2.3 in unknown mode.',
                arg: undefined,
                level: 'info',
            },
            {
                msg: 'Unhandled rejection:',
                arg: {
                    reason: error,
                },
                level: 'error',
            },
        ]);

        verify(testEnv.processMock.exit(200)).once();
    });

    it(`must subscribe to unhandled exception and handle them properly (exit by default)`, async () => {
        const listeners: any[] = [];

        const testEnv = new TestEnv();
        when(testEnv.processMock.on).thenReturn((_signal: any, listener: any) => {
            if (_signal == 'uncaughtException') {
                listeners.push(listener);
            }
            return testEnv.process;
        });

        const nodeJsApp = new NodeJsApp(m3, testEnv.process);
        await nodeJsApp.runAsync();

        expect(listeners.length).to.be.equal(1);

        const injector = await nodeJsApp.containerBuilderCreated$.pipe(map((b) => b.injector)).toPromise();

        const error = new Error('test it error');
        listeners.forEach((arg) => {
            arg(error);
        });

        expect(injector.get(LoggerForTest).events).to.be.deep.equal([
            {
                msg: 'Started version 1.2.3 in unknown mode.',
                arg: undefined,
                level: 'info',
            },
            {
                msg: 'Uncaught exception:',
                arg: {
                    error,
                },
                level: 'error',
            },
        ]);

        verify(testEnv.processMock.exit(201)).once();
    });

    it('must not hang bootstrap hangs', async () => {
        const testEnv = new TestEnv();

        const nodeJsApp = new NodeJsApp(m5startupDelaying, testEnv.process);

        await expect(nodeJsApp.runAsync()).to.be.rejectedWith('Container startup: Timed out after 0.001 seconds.');

        const injector = await nodeJsApp.containerBuilderCreated$.pipe(map((b) => b.injector)).toPromise();

        expect(injector.get(LoggerForTest).events).to.be.deep.equal([]);
    });
});
