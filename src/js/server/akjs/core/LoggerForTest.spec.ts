import { expect } from 'chai';
import { LoggerForTest } from './LoggerForTest';

describe('LoggerForTest', () => {
    it('should collect logging events into an accessible array', () => {
        const snaps = [];

        const logger = new LoggerForTest();
        snaps.push(logger.getLoggedEventCounts());
        logger.debug('debug', 'debug-arg');
        snaps.push(logger.getLoggedEventCounts());
        logger.info('info', 'info-arg');
        snaps.push(logger.getLoggedEventCounts());
        logger.warn('warn', 'warn-arg');
        snaps.push(logger.getLoggedEventCounts());
        logger.error('error', 'error-arg');
        snaps.push(logger.getLoggedEventCounts());
        logger.debug('debug');
        snaps.push(logger.getLoggedEventCounts());
        logger.info('info');
        snaps.push(logger.getLoggedEventCounts());
        logger.warn('warn');
        snaps.push(logger.getLoggedEventCounts());
        logger.error('error');
        snaps.push(logger.getLoggedEventCounts());

        expect(logger.isDebugEnabled()).to.be.equal(true);
        logger.debugEnabled = false;
        logger.debug('not there');
        logger.debug('not there', 222);

        expect(logger.events).to.deep.equal([
            { msg: 'debug', arg: 'debug-arg', level: 'debug' },
            { msg: 'info', arg: 'info-arg', level: 'info' },
            { msg: 'warn', arg: 'warn-arg', level: 'warn' },
            { msg: 'error', arg: 'error-arg', level: 'error' },
            { msg: 'debug', arg: undefined, level: 'debug' },
            { msg: 'info', arg: undefined, level: 'info' },
            { msg: 'warn', arg: undefined, level: 'warn' },
            { msg: 'error', arg: undefined, level: 'error' },
        ]);

        expect(snaps).to.be.deep.equal([
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
            {
                debugEventsLogged: 2,
                infoEventsLogged: 1,
                warnEventsLogged: 1,
                errorEventsLogged: 1,
            },
            {
                debugEventsLogged: 2,
                infoEventsLogged: 2,
                warnEventsLogged: 1,
                errorEventsLogged: 1,
            },
            {
                debugEventsLogged: 2,
                infoEventsLogged: 2,
                warnEventsLogged: 2,
                errorEventsLogged: 1,
            },
            {
                debugEventsLogged: 2,
                infoEventsLogged: 2,
                warnEventsLogged: 2,
                errorEventsLogged: 2,
            },
        ]);
    });
});
