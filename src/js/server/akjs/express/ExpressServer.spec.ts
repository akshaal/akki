import { expect } from 'chai';
import { IRouter } from 'express';
import { LoggerForTest } from '../core/LoggerForTest';
import { ExpressServer } from './ExpressServer';
import { ExpressServerForTest } from './ExpressServerForTest';
import { RouteMounter } from './RouteMounter';

describe('ExpressServer', () => {
    it('should not do anything until started', () => {
        const logger = new LoggerForTest();
        new ExpressServer('127.0.0.1', '0', logger);
        expect(logger.events).to.be.deep.equal([]);
    });

    it('should give a warning if used without configured route mounters', async () => {
        const logger = new LoggerForTest();
        const express = new ExpressServer('127.0.0.1', '0', logger);
        await express.onBootstrapPostConstruct();

        expect(logger.events).deep.contain({
            msg: 'No route mounters found in the IoC container for the express server.',
            arg: undefined,
            level: 'warn',
        });

        await express.onBootstrapPreDestroy();
    });

    it('should give a message with information on what interface the server listens', async () => {
        const logger = new LoggerForTest();
        const express = new ExpressServer('127.0.0.1', '0', logger);
        await express.onBootstrapPostConstruct();

        const [{ msg }] = logger.events.filter((e) => e.level === 'info');

        expect(msg).contains('Listening on IPv4 127.0.0.1:');

        await express.onBootstrapPreDestroy();
    });

    it('should not crash if onBootstrapPreDestroy is invoked without onBootstrapPostConstruct (for some reason)', async () => {
        const logger = new LoggerForTest();
        const express = new ExpressServer('127.0.0.1', '0', logger);
        await express.onBootstrapPreDestroy();
    });

    it('should properly handle error when listening on an illegal port', async () => {
        const logger = new LoggerForTest();
        const express = new ExpressServer('127.0.0.1', '6553600', logger);
        await expect(express.onBootstrapPostConstruct()).to.be.rejectedWith('port should be >= 0 and < 65536');
    });

    it('should properly handle error when using a busy or privileged port', async () => {
        const logger = new LoggerForTest();
        const express = new ExpressServer('127.0.0.1', '25', logger);
        await expect(express.onBootstrapPostConstruct()).to.be.rejectedWith('permission denied');
    });

    it('should handle error during shutdown', async () => {
        const logger = new LoggerForTest();
        const express = new ExpressServer('127.0.0.1', '25', logger);

        try {
            await express.onBootstrapPostConstruct();
            // eslint-disable-next-line no-empty
        } catch (e) {}

        await expect(express.onBootstrapPreDestroy()).to.be.rejectedWith('Server is not running');
    });

    it('should handle requests using routers', async () => {
        class RM extends RouteMounter {
            public mountOnRouter(router: IRouter): void {
                router.get('/abc', (_, res) => {
                    res.end('xxx');
                });
            }
        }

        const logger = new LoggerForTest();
        const express = new ExpressServerForTest(logger, [new RM()]);
        await express.onBootstrapPostConstruct();

        const response = await express.request().get('/abc');
        expect(response.text).to.equal('xxx');

        await express.onBootstrapPreDestroy();
    });

    it('should trust proxy by default', async () => {
        let trust: unknown;
        class RM extends RouteMounter {
            public mountOnRouter(router: IRouter): void {
                trust = router.get('trust proxy');
            }
        }

        const logger = new LoggerForTest();
        const express = new ExpressServerForTest(logger, [new RM()]);
        await express.onBootstrapPostConstruct();
        await express.onBootstrapPreDestroy();

        expect(trust).to.be.equal(true);
    });
});
