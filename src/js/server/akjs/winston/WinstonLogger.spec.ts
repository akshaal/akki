import { expect } from 'chai';
import {
    WinstonLogger,
    ENV_CONSOLE_LOG_LEVEL,
    ENV_DEBUG_LOG_FILENAME,
    ENV_DEBUG_LOG_FILE_ENABLED,
    ENV_DEBUG_LOG_FILE_MAX_FILES,
    ENV_DEBUG_LOG_FILE_MAX_SIZE_M,
} from './WinstonLogger';

describe('WinstonLogger', () => {
    it("should make sure defaults don't crash anything and make sense", () => {
        const logger = new WinstonLogger(
            ENV_DEBUG_LOG_FILE_ENABLED.defaultValue,
            ENV_CONSOLE_LOG_LEVEL.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_SIZE_M.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_FILES.defaultValue,
            ENV_DEBUG_LOG_FILENAME.defaultValue,
        );

        logger.debug('a');
        logger.debug('a', '1');
        logger.info('b');
        logger.info('b', '2');
        logger.info('b', '3');
        logger.warn('c');
        logger.warn('c', '3');
        logger.warn('c', '3');
        logger.warn('c', '5');
        logger.error('d');
        logger.error('d', '4');
        logger.error('d', '5');
        logger.error('d', '6');
        logger.error('d', '7');
        logger.error('d', '8');

        expect(logger.isDebugEnabled()).to.be.equal(true);
        expect(logger.debugEventsLogged).to.be.equal(2);
        expect(logger.infoEventsLogged).to.be.equal(3);
        expect(logger.warnEventsLogged).to.be.equal(4);
        expect(logger.errorEventsLogged).to.be.equal(6);
        expect(logger.getLoggedEventCounts()).to.be.deep.equal({
            debugEventsLogged: 2,
            infoEventsLogged: 3,
            warnEventsLogged: 4,
            errorEventsLogged: 6,
        });
    });

    it('work without debug logging', () => {
        const logger = new WinstonLogger(
            'false',
            ENV_CONSOLE_LOG_LEVEL.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_SIZE_M.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_FILES.defaultValue,
            ENV_DEBUG_LOG_FILENAME.defaultValue,
        );

        logger.debug('a');
        logger.debug('a', '1');
        logger.info('b');
        logger.info('b', '2');
        logger.info('b', '3');
        logger.warn('c');
        logger.warn('c', '3');
        logger.warn('c', '3');
        logger.warn('c', '5');
        logger.error('d');
        logger.error('d', '4');
        logger.error('d', '5');
        logger.error('d', '6');
        logger.error('d', '7');
        logger.error('d', '8');

        expect(logger.isDebugEnabled()).to.be.equal(false);
        expect(logger.debugEventsLogged).to.be.equal(0);
        expect(logger.infoEventsLogged).to.be.equal(3);
        expect(logger.warnEventsLogged).to.be.equal(4);
        expect(logger.errorEventsLogged).to.be.equal(6);
        expect(logger.getLoggedEventCounts()).to.be.deep.equal({
            debugEventsLogged: 0,
            infoEventsLogged: 3,
            warnEventsLogged: 4,
            errorEventsLogged: 6,
        });
    });

    it('log debug to console if requested', () => {
        const logger = new WinstonLogger(
            'false',
            'debug',
            ENV_DEBUG_LOG_FILE_MAX_SIZE_M.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_FILES.defaultValue,
            ENV_DEBUG_LOG_FILENAME.defaultValue,
        );

        logger.debug('a');
        logger.debug('a', '1');
        logger.info('b');
        logger.info('b', '2');
        logger.info('b', '3');
        logger.warn('c');
        logger.warn('c', '3');
        logger.warn('c', '3');
        logger.warn('c', '5');
        logger.error('d');
        logger.error('d', '4');
        logger.error('d', '5');
        logger.error('d', '6');
        logger.error('d', '7');
        logger.error('d', '8');

        expect(logger.isDebugEnabled()).to.be.equal(true);
        expect(logger.debugEventsLogged).to.be.equal(2);
        expect(logger.infoEventsLogged).to.be.equal(3);
        expect(logger.warnEventsLogged).to.be.equal(4);
        expect(logger.errorEventsLogged).to.be.equal(6);
        expect(logger.getLoggedEventCounts()).to.be.deep.equal({
            debugEventsLogged: 2,
            infoEventsLogged: 3,
            warnEventsLogged: 4,
            errorEventsLogged: 6,
        });
    });

    it('not count info if console is higher than info and debug file is disabled', () => {
        const logger = new WinstonLogger(
            'false',
            'warn',
            ENV_DEBUG_LOG_FILE_MAX_SIZE_M.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_FILES.defaultValue,
            ENV_DEBUG_LOG_FILENAME.defaultValue,
        );

        logger.debug('a');
        logger.debug('a', '1');
        logger.info('b');
        logger.info('b', '2');
        logger.info('b', '3');
        logger.warn('c');
        logger.warn('c', '3');
        logger.warn('c', '3');
        logger.warn('c', '5');
        logger.error('d');
        logger.error('d', '4');
        logger.error('d', '5');
        logger.error('d', '6');
        logger.error('d', '7');
        logger.error('d', '8');

        expect(logger.isDebugEnabled()).to.be.equal(false);
        expect(logger.debugEventsLogged).to.be.equal(0);
        expect(logger.infoEventsLogged).to.be.equal(0);
        expect(logger.warnEventsLogged).to.be.equal(4);
        expect(logger.errorEventsLogged).to.be.equal(6);
        expect(logger.getLoggedEventCounts()).to.be.deep.equal({
            debugEventsLogged: 0,
            infoEventsLogged: 0,
            warnEventsLogged: 4,
            errorEventsLogged: 6,
        });
    });

    it('not count warn if console is higher than warn and debug file is disabled', () => {
        const logger = new WinstonLogger(
            'false',
            'error',
            ENV_DEBUG_LOG_FILE_MAX_SIZE_M.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_FILES.defaultValue,
            ENV_DEBUG_LOG_FILENAME.defaultValue,
        );

        logger.debug('a');
        logger.debug('a', '1');
        logger.info('b');
        logger.info('b', '2');
        logger.info('b', '3');
        logger.warn('c');
        logger.warn('c', '3');
        logger.warn('c', '3');
        logger.warn('c', '5');
        logger.error('d');
        logger.error('d', '4');
        logger.error('d', '5');
        logger.error('d', '6');
        logger.error('d', '7');
        logger.error('d', '8');

        expect(logger.isDebugEnabled()).to.be.equal(false);
        expect(logger.debugEventsLogged).to.be.equal(0);
        expect(logger.infoEventsLogged).to.be.equal(0);
        expect(logger.warnEventsLogged).to.be.equal(0);
        expect(logger.errorEventsLogged).to.be.equal(6);
        expect(logger.getLoggedEventCounts()).to.be.deep.equal({
            debugEventsLogged: 0,
            infoEventsLogged: 0,
            warnEventsLogged: 0,
            errorEventsLogged: 6,
        });
    });

    it('not count error if console is higher than error and debug file is disabled', () => {
        const logger = new WinstonLogger(
            'false',
            'fatal',
            ENV_DEBUG_LOG_FILE_MAX_SIZE_M.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_FILES.defaultValue,
            ENV_DEBUG_LOG_FILENAME.defaultValue,
        );

        logger.debug('a');
        logger.debug('a', '1');
        logger.info('b');
        logger.info('b', '2');
        logger.info('b', '3');
        logger.warn('c');
        logger.warn('c', '3');
        logger.warn('c', '3');
        logger.warn('c', '5');
        logger.error('d');
        logger.error('d', '4');
        logger.error('d', '5');
        logger.error('d', '6');
        logger.error('d', '7');
        logger.error('d', '8');

        expect(logger.isDebugEnabled()).to.be.equal(false);
        expect(logger.debugEventsLogged).to.be.equal(0);
        expect(logger.infoEventsLogged).to.be.equal(0);
        expect(logger.warnEventsLogged).to.be.equal(0);
        expect(logger.errorEventsLogged).to.be.equal(0);
        expect(logger.getLoggedEventCounts()).to.be.deep.equal({
            debugEventsLogged: 0,
            infoEventsLogged: 0,
            warnEventsLogged: 0,
            errorEventsLogged: 0,
        });
    });

    it('not count everything if console is muted and debug file is enabled', () => {
        const logger = new WinstonLogger(
            'true',
            'fatal',
            ENV_DEBUG_LOG_FILE_MAX_SIZE_M.defaultValue,
            ENV_DEBUG_LOG_FILE_MAX_FILES.defaultValue,
            ENV_DEBUG_LOG_FILENAME.defaultValue,
        );

        logger.debug('a');
        logger.debug('a', '1');
        logger.info('b');
        logger.info('b', '2');
        logger.info('b', '3');
        logger.warn('c');
        logger.warn('c', '3');
        logger.warn('c', '3');
        logger.warn('c', '5');
        logger.error('d');
        logger.error('d', '4');
        logger.error('d', { a: '5', b: '10' });
        logger.error('d', '6');
        logger.error('d', { x: '7' });
        logger.error('d', '8');

        expect(logger.isDebugEnabled()).to.be.equal(true);
        expect(logger.debugEventsLogged).to.be.equal(2);
        expect(logger.infoEventsLogged).to.be.equal(3);
        expect(logger.warnEventsLogged).to.be.equal(4);
        expect(logger.errorEventsLogged).to.be.equal(6);
        expect(logger.getLoggedEventCounts()).to.be.deep.equal({
            debugEventsLogged: 2,
            infoEventsLogged: 3,
            warnEventsLogged: 4,
            errorEventsLogged: 6,
        });
    });
});
