/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import { expect } from 'chai';
import { anyString, anything, instance, mock, verify, when } from 'ts-mockito';
import { AkModule } from '../container/AkModule';
import { ContainerBuilder } from '../container/ContainerBuilder';
import { DelayedLogger } from '../core/DelayedLogger';
import { EnvToken } from '../core/EnvToken';
import { EnvTokenResolver } from '../core/EnvTokenResolver';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { Logger } from '../core/Logger';
import { LoggerForTest } from '../core/LoggerForTest';
import { EnvTokensDumper } from './EnvTokensDumper';

const ENV_T1 = new EnvToken({ id: 'akjs_env_test_vvvv22', description: 'bb', defaultValue: 'xx' });
const ENV_T2 = new EnvToken({ id: 'akjs_env_test_a2a2aer123sws', description: 'bb2', defaultValue: 'xx2' });
const ENV_T3 = new EnvToken({ id: 'akjs_env_test_ttt23122vw', description: 'bb2211', defaultValue: 'xy21' });
const ENV_T4 = new EnvToken({ id: 'akjs_env_test_test23122vw', description: 'bb2211desc', defaultValue: 'xy23' });

describe('EnvTokensDumper', () => {
    it('should dump information about token on post-construct event', async () => {
        const loggerForTest = new LoggerForTest();

        process.env.akjs_env_test_ttt23122vw = 'xy21';
        process.env.akjs_env_test_test23122vw = 'vvv21';

        const m = new AkModule('test', (defs) =>
            defs
                .bootstrap(EnvTokensDumper)
                .with(EnvTokenResolver)
                .with(DelayedLogger)
                .withClass({ provide: LifecycleEvents, useClass: LifecycleEventsImpl })
                .withValue({ provide: Logger, useValue: loggerForTest })
                .withFactory(ENV_T1.asFactoryProvider())
                .withFactory(ENV_T2.asFactoryProvider())
                .withFactory(ENV_T3.asFactoryProvider())
                .withFactory(ENV_T4.asFactoryProvider())
                .withValue({ provide: ENV_T2, useValue: 'custom\nmultiline ' }),
        );

        const containerBuilder = new ContainerBuilder(m);

        expect(loggerForTest.events).to.be.deep.equal([]);

        const container = await containerBuilder.finishConstruction();

        expect(loggerForTest.events).to.be.deep.equal([
            {
                msg:
                    'EnvTokens resolved as:\n' +
                    '    akjs_env_test_a2a2aer123sws from module test: "custom\\nmultiline "\n' +
                    '    akjs_env_test_test23122vw (from environment): "vvv21"\n' +
                    '    akjs_env_test_ttt23122vw (default) (from environment): "xy21"\n' +
                    '    akjs_env_test_vvvv22 (default): "xx"',
                arg: undefined,
                level: 'debug',
            },
        ]);

        await container.shutdown();
    });

    it('should not even try to do anything if debug logging is disabled', async () => {
        const loggerMock = mock<Logger>();
        when(loggerMock.isDebugEnabled()).thenReturn(false);

        const m = new AkModule('test', (defs) =>
            defs
                .bootstrap(EnvTokensDumper)
                .with(EnvTokenResolver)
                .with(DelayedLogger)
                .withClass({ provide: LifecycleEvents, useClass: LifecycleEventsImpl })
                .withValue({ provide: Logger, useValue: instance(loggerMock) })
                .withFactory(ENV_T1.asFactoryProvider()),
        );

        const containerBuilder = new ContainerBuilder(m);
        const container = await containerBuilder.finishConstruction();

        verify(loggerMock.debug(anyString())).never();
        verify(loggerMock.debug(anyString(), anything())).never();

        await container.shutdown();
    });
});
