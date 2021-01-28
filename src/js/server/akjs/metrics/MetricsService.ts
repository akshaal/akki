import {
    Counter,
    CounterConfiguration,
    Gauge,
    GaugeConfiguration,
    MetricConfiguration,
    Registry,
    Summary,
    SummaryConfiguration,
} from 'prom-client';
import { Injectable } from 'injection-js';
import { Observable, ReplaySubject } from 'rxjs';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { Logger } from '../core/Logger';

@Injectable()
export class MetricsService {
    private readonly _registry = new Registry();
    private readonly _updateSubject = new ReplaySubject<void>(1);
    private readonly _update$ = this._updateSubject.pipe(this._lifecycleEvents.takeUntilDestroyed());

    public constructor(private readonly _lifecycleEvents: LifecycleEvents, private readonly _logger: Logger) {
        this._lifecycleEvents.postConstruct$.subscribe(() => {
            this._updateSubject.next();
        });

        // Note, no need to subscribe to destroy because we use takeUntilDestroyed above..
    }

    /**
     * Observable that gets its next value each request for metrics is made.
     */
    public get update$(): Observable<void> {
        return this._update$;
    }

    public getMetrics(): Promise<string> {
        if (this._lifecycleEvents.containerConstructed && !this._lifecycleEvents.containerDestroyed) {
            this._updateSubject.next();
            return this._registry.metrics();
        } else {
            return Promise.resolve('');
        }
    }

    public createGauge(gaugeConfiguration: GaugeConfiguration<string>): Gauge<string> {
        this._log(gaugeConfiguration);
        return new Gauge({ ...gaugeConfiguration, registers: [this._registry] });
    }

    public createCounter(counterConfiguration: CounterConfiguration<string>): Counter<string> {
        this._log(counterConfiguration);
        return new Counter({ ...counterConfiguration, registers: [this._registry] });
    }

    public createSummary(summaryConfiguration: SummaryConfiguration<string>): Summary<string> {
        this._log(summaryConfiguration);
        return new Summary({ ...summaryConfiguration, registers: [this._registry] });
    }

    private _log(metricConfiguration: MetricConfiguration<string>): void {
        this._logger.debug(`Added metric: ${metricConfiguration.name}: ${metricConfiguration.help}`);
    }
}
