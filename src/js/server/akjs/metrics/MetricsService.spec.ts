import { expect } from 'chai';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { LoggerForTest } from '../core/LoggerForTest';
import { MetricsService } from './MetricsService';

describe('MetricsService', () => {
    it('should emit update events until postConstruct is called', async () => {
        const lifecycleEvents = new LifecycleEventsImpl();
        const metricsService = new MetricsService(lifecycleEvents, new LoggerForTest());

        let called = false;
        metricsService.update$.subscribe(() => {
            called = true;
        });

        expect(called).to.be.equal(false);

        await lifecycleEvents.onBootstrapPostConstruct();

        expect(called).to.be.equal(true);
    });

    it('should emit update event on each call to getMetrics() method and prior to returning result', async () => {
        const lifecycleEvents = new LifecycleEventsImpl();
        const metricsService = new MetricsService(lifecycleEvents, new LoggerForTest());

        const counter = metricsService.createCounter({ name: 'x', help: 'z' });

        metricsService.update$.subscribe(() => {
            counter.inc();
        });

        expect(await metricsService.getMetrics()).to.be.equal('');

        await lifecycleEvents.onBootstrapPostConstruct();

        expect(await metricsService.getMetrics()).to.contain('x 2\n');
        expect(await metricsService.getMetrics()).to.contain('x 3\n');
        expect(await metricsService.getMetrics()).to.contain('x 4\n');

        await lifecycleEvents.onBootstrapPreDestroy();

        expect(await metricsService.getMetrics()).to.be.equal('');
    });

    it('should register counters in a service owned registry', async () => {
        const lifecycleEvents = new LifecycleEventsImpl();
        const metricsService1 = new MetricsService(lifecycleEvents, new LoggerForTest());
        const metricsService2 = new MetricsService(lifecycleEvents, new LoggerForTest());

        await lifecycleEvents.onBootstrapPostConstruct();

        metricsService1.createCounter({ name: 'x', help: 'z' });
        metricsService2.createCounter({ name: 'x', help: 'z' }).inc();

        expect(await metricsService1.getMetrics()).to.be.equal('# HELP x z\n# TYPE x counter\nx 0\n');
        expect(await metricsService2.getMetrics()).to.be.equal('# HELP x z\n# TYPE x counter\nx 1\n');
    });

    it('should register gauges in a service owned registry', async () => {
        const lifecycleEvents = new LifecycleEventsImpl();
        const metricsService1 = new MetricsService(lifecycleEvents, new LoggerForTest());
        const metricsService2 = new MetricsService(lifecycleEvents, new LoggerForTest());

        await lifecycleEvents.onBootstrapPostConstruct();

        metricsService1.createGauge({ name: 'x', help: 'z' });
        metricsService2.createGauge({ name: 'x', help: 'z' }).inc();

        expect(await metricsService1.getMetrics()).to.be.equal('# HELP x z\n# TYPE x gauge\nx 0\n');
        expect(await metricsService2.getMetrics()).to.be.equal('# HELP x z\n# TYPE x gauge\nx 1\n');
    });

    it('should register summaries in a service owned registry', async () => {
        const lifecycleEvents = new LifecycleEventsImpl();
        const metricsService1 = new MetricsService(lifecycleEvents, new LoggerForTest());
        const metricsService2 = new MetricsService(lifecycleEvents, new LoggerForTest());

        await lifecycleEvents.onBootstrapPostConstruct();

        metricsService1.createSummary({ name: 'x', help: 'z', percentiles: [0.1, 0.5] });
        metricsService2.createSummary({ name: 'x', help: 'z', percentiles: [0.1, 0.5] }).observe(2);

        expect(await metricsService1.getMetrics()).to.be.equal(
            '# HELP x z\n# TYPE x summary\nx{quantile="0.1"} 0\nx{quantile="0.5"} 0\nx_sum 0\nx_count 0\n',
        );

        expect(await metricsService2.getMetrics()).to.be.equal(
            '# HELP x z\n# TYPE x summary\nx{quantile="0.1"} 2\nx{quantile="0.5"} 2\nx_sum 2\nx_count 1\n',
        );
    });
});
