/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import { ConsoleLogger } from './ConsoleLogger';
import { mock, instance, verify } from 'ts-mockito';
import { expect } from 'chai';

describe('ConsoleLogger', () => {
    it('should have debug enabled', () => {
        expect(new ConsoleLogger().isDebugEnabled()).to.be.equal(true);
    });

    it('should print to console along with argument', () => {
        const snaps = [];
        const origConsole = console;
        const consoleMock = mock<Console>();

        try {
            console = instance(consoleMock);

            const logger = new ConsoleLogger();
            snaps.push(logger.getLoggedEventCounts());
            logger.debug('debug', 'debug-arg');
            snaps.push(logger.getLoggedEventCounts());
            logger.info('info', 'info-arg');
            snaps.push(logger.getLoggedEventCounts());
            logger.warn('warn', 'warn-arg');
            snaps.push(logger.getLoggedEventCounts());
            logger.error('error', 'error-arg');
            snaps.push(logger.getLoggedEventCounts());
        } finally {
            console = origConsole;
        }

        verify(consoleMock.error('error', 'error-arg')).once();
        verify(consoleMock.warn('warn', 'warn-arg')).once();
        verify(consoleMock.info('info', 'info-arg')).once();
        verify(consoleMock.debug('debug', 'debug-arg')).once();

        expect(snaps).to.deep.equal([
            {
                debugEventsLogged: 0,
                infoEventsLogged: 0,
                warnEventsLogged: 0,
                errorEventsLogged: 0,
            },
            {
                debugEventsLogged: 1,
                infoEventsLogged: 0,
                warnEventsLogged: 0,
                errorEventsLogged: 0,
            },
            {
                debugEventsLogged: 1,
                infoEventsLogged: 1,
                warnEventsLogged: 0,
                errorEventsLogged: 0,
            },
            {
                debugEventsLogged: 1,
                infoEventsLogged: 1,
                warnEventsLogged: 1,
                errorEventsLogged: 0,
            },
            {
                debugEventsLogged: 1,
                infoEventsLogged: 1,
                warnEventsLogged: 1,
                errorEventsLogged: 1,
            },
        ]);
    });

    it('should avoid printing undefined for missing argument', () => {
        const origConsole = console;
        const consoleMock = mock<Console>();

        try {
            console = instance(consoleMock);
            const logger = new ConsoleLogger();
            logger.debug('debug');
            logger.info('info');
            logger.warn('warn');
            logger.error('error');
        } finally {
            console = origConsole;
        }

        verify(consoleMock.error('error')).once();
        verify(consoleMock.warn('warn')).once();
        verify(consoleMock.info('info')).once();
        verify(consoleMock.debug('debug')).once();
    });
});
