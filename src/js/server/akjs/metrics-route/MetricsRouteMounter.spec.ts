/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import 'reflect-metadata';
import { mock, when, instance, reset } from 'ts-mockito';
import { MetricsService } from '../metrics/MetricsService';
import { MetricsRouteMounter } from './MetricsRouteMounter';
import { expect } from 'chai';
import { LoggerForTest } from '../core/LoggerForTest';
import { ExpressServerForTest } from '../express/ExpressServerForTest';

describe('MetricsRouteMounter', () => {
    const metricsServiceMock = mock<MetricsService>();
    let expressServerService: ExpressServerForTest;
    let logger: LoggerForTest;

    beforeEach(async () => {
        reset(metricsServiceMock);

        logger = new LoggerForTest();
        const mounter = new MetricsRouteMounter(instance(metricsServiceMock));
        expressServerService = new ExpressServerForTest(logger, [mounter]);

        await expressServerService.onBootstrapPostConstruct();
    });

    afterEach(async () => {
        await expressServerService.onBootstrapPreDestroy();
    });

    it('should provide /metrics route that returns what MetricsService says (1)', async () => {
        when(metricsServiceMock.getMetrics()).thenResolve('HELLO');

        const response = await expressServerService.request().get('/metrics');
        expect(response.status).to.equal(200);
        expect(response.header['content-type']).to.equal('text/plain; version=0.0.4; charset=utf-8');
        expect(response.text).to.equal('HELLO');
    });

    it('should provide /metrics route that returns what MetricsService says (2)', async () => {
        when(metricsServiceMock.getMetrics()).thenResolve('OLLEH');

        const response = await expressServerService.request().get('/metrics');
        expect(response.status).to.equal(200);
        expect(response.header['content-type']).to.equal('text/plain; version=0.0.4; charset=utf-8');
        expect(response.text).to.equal('OLLEH');
    });
});
