import { expect } from 'chai';
import { instance, mock, verify, when } from 'ts-mockito';
import { Injector } from '../container/Injector';
import { DelayedLogger } from './DelayedLogger';
import { LifecycleEventsImpl } from './LifecycleEventsImpl';
import { Logger } from './Logger';
import { LoggerForTest } from './LoggerForTest';

describe('DelayedLogger', () => {
    let injectorMock: Injector;
    let lifecycleEvents: LifecycleEventsImpl;
    let delayedLogger: DelayedLogger;
    let logger: LoggerForTest;

    beforeEach(() => {
        injectorMock = mock<Injector>();
        lifecycleEvents = new LifecycleEventsImpl();

        logger = new LoggerForTest();
        when(injectorMock.get(Logger)).thenReturn(logger);

        delayedLogger = new DelayedLogger(lifecycleEvents, instance(injectorMock));
    });

    it('should buffer logging events until postConstruct event is emitted and than passthrough logging', async () => {
        delayedLogger.info('x');
        delayedLogger.info('a', 123);
        delayedLogger.debug('b', 321);
        delayedLogger.error('e', 22);
        delayedLogger.debug('c');
        delayedLogger.debug('eee', 2);
        delayedLogger.debug('eee2', 2);
        delayedLogger.warn('m');
        delayedLogger.warn('i', 33);
        delayedLogger.info('y');
        delayedLogger.error('z');

        verify(injectorMock.get(Logger)).never();
        expect(logger.events.length).to.be.equal(0);
        expect(delayedLogger.isDebugEnabled()).to.be.equal(true);
        expect(delayedLogger.debugEventsLogged).to.be.equal(0);
        expect(delayedLogger.infoEventsLogged).to.be.equal(0);
        expect(delayedLogger.errorEventsLogged).to.be.equal(0);
        expect(delayedLogger.warnEventsLogged).to.be.equal(0);

        await lifecycleEvents.onBootstrapPostConstruct();

        verify(injectorMock.get(Logger)).once();
        expect(delayedLogger.isDebugEnabled()).to.be.equal(true);
        expect(delayedLogger.debugEventsLogged).to.be.equal(4);
        expect(delayedLogger.infoEventsLogged).to.be.equal(3);
        expect(delayedLogger.errorEventsLogged).to.be.equal(2);
        expect(delayedLogger.warnEventsLogged).to.be.equal(2);

        expect(logger.events).to.be.deep.equal([
            { msg: 'x', arg: undefined, level: 'info' },
            { msg: 'a', arg: 123, level: 'info' },
            { msg: 'b', arg: 321, level: 'debug' },
            { msg: 'e', arg: 22, level: 'error' },
            { msg: 'c', arg: undefined, level: 'debug' },
            { msg: 'eee', arg: 2, level: 'debug' },
            { msg: 'eee2', arg: 2, level: 'debug' },
            { msg: 'm', arg: undefined, level: 'warn' },
            { msg: 'i', arg: 33, level: 'warn' },
            { msg: 'y', arg: undefined, level: 'info' },
            { msg: 'z', arg: undefined, level: 'error' },
        ]);

        logger.events = [];

        delayedLogger.info('x');
        delayedLogger.info('a', 123);
        delayedLogger.debug('eee');
        delayedLogger.debug('eee2', 2);
        delayedLogger.warn('mde');
        delayedLogger.warn('i22', 133);
        delayedLogger.error('z112');
        delayedLogger.error('z11', 32);

        expect(logger.events).to.be.deep.equal([
            { msg: 'x', arg: undefined, level: 'info' },
            { msg: 'a', arg: 123, level: 'info' },
            { msg: 'eee', arg: undefined, level: 'debug' },
            { msg: 'eee2', arg: 2, level: 'debug' },
            { msg: 'mde', arg: undefined, level: 'warn' },
            { msg: 'i22', arg: 133, level: 'warn' },
            { msg: 'z112', arg: undefined, level: 'error' },
            { msg: 'z11', arg: 32, level: 'error' },
        ]);
    });
});
