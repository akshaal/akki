/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import { expect } from 'chai';
import { anything, instance, mock, verify } from 'ts-mockito';
import { DelayedLogger } from './DelayedLogger';
import { EnvToken } from './EnvToken';
import { EnvTokenResolver } from './EnvTokenResolver';

function verifyNothingElseThanSimpleDebugAndWarn(delayedLoggerMock: DelayedLogger): void {
    verify(delayedLoggerMock.info(anything(), anything())).never();
    verify(delayedLoggerMock.warn(anything(), anything())).never();
    verify(delayedLoggerMock.error(anything(), anything())).never();
    verify(delayedLoggerMock.debug(anything(), anything())).never();
    verify(delayedLoggerMock.info(anything())).never();
    verify(delayedLoggerMock.error(anything())).never();
}

describe('EnvTokenResolver', () => {
    it('should not do anything until used', () => {
        const delayedLoggerMock = mock<DelayedLogger>();
        new EnvTokenResolver(instance(delayedLoggerMock));
        verifyNothingElseThanSimpleDebugAndWarn(delayedLoggerMock);
        verify(delayedLoggerMock.debug(anything())).never();
        verify(delayedLoggerMock.warn(anything())).never();
    });

    it('should work without process.env', () => {
        const delayedLoggerMock = mock<DelayedLogger>();
        const { env } = process;
        let value: string;

        try {
            (<any>process).env = undefined;
            const resolver = new EnvTokenResolver(instance(delayedLoggerMock));
            value = resolver.resolve(new EnvToken({ id: 'a', description: 'b', defaultValue: 'c' }));
        } finally {
            process.env = env;
        }

        expect(value).to.equal('c');
        verifyNothingElseThanSimpleDebugAndWarn(delayedLoggerMock);
        verify(delayedLoggerMock.debug('Using default value for EnvToken a: c')).once();
        verify(
            delayedLoggerMock.warn(
                "'process.env' is not defined. EnvToken instances will always be resolved to default values unless explicitly overridden in modules.",
            ),
        ).once();
    });

    it('should resolve to value from environment if present,', () => {
        const delayedLoggerMock = mock<DelayedLogger>();
        const resolver = new EnvTokenResolver(instance(delayedLoggerMock));

        try {
            process.env.AKJS_ENV_TOKEN_TEST = '123';
            const t = new EnvToken({ id: 'AKJS_ENV_TOKEN_TEST', description: 'b', defaultValue: 'c' });
            const value = resolver.resolve(t);
            const value2 = resolver.resolve(t);
            expect(value).to.be.equal('123');
            expect(value2).to.be.equal(value);
            verify(delayedLoggerMock.warn(anything())).never();
            verify(delayedLoggerMock.debug("Using 'process.env' for EnvToken resolving.")).once();
            verify(delayedLoggerMock.debug('Using environment value for EnvToken AKJS_ENV_TOKEN_TEST: c')).once();
        } finally {
            delete process.env.AKJS_ENV_TOKEN_TEST;
        }
    });

    it('should resolve to default value if not present in environment,', () => {
        const delayedLoggerMock = mock<DelayedLogger>();
        const resolver = new EnvTokenResolver(instance(delayedLoggerMock));

        delete process.env.AKJS_ENV_TOKEN_TEST;
        const t = new EnvToken({ id: 'AKJS_ENV_TOKEN_TEST', description: 'b', defaultValue: 'c' });
        const value = resolver.resolve(t);
        const value2 = resolver.resolve(t);

        expect(value).to.be.equal('c');
        expect(value2).to.be.equal(value);
        verify(delayedLoggerMock.warn(anything())).never();
        verify(delayedLoggerMock.debug("Using 'process.env' for EnvToken resolving.")).once();
        verify(delayedLoggerMock.debug('Using default value for EnvToken AKJS_ENV_TOKEN_TEST: c')).once();
    });

    it('should resolve to undefined value if not present in environment and mode is NO-DEFAULT,', () => {
        const delayedLoggerMock = mock<DelayedLogger>();
        const resolver = new EnvTokenResolver(instance(delayedLoggerMock));

        delete process.env.AKJS_ENV_TOKEN_TEST;
        const t = new EnvToken({ id: 'AKJS_ENV_TOKEN_TEST', description: 'b', defaultValue: 'c' });
        const value = resolver.resolve(t, 'NO-DEFAULT');
        const value2 = resolver.resolve(t, 'NO-DEFAULT');

        expect(value).to.be.equal(undefined);
        expect(value2).to.be.equal(undefined);
        verify(delayedLoggerMock.warn(anything())).never();
        verify(delayedLoggerMock.debug("Using 'process.env' for EnvToken resolving.")).once();
    });
});
