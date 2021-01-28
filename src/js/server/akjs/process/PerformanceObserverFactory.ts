import { PerformanceObserverCallback, PerformanceObserver } from 'perf_hooks';
import { Injectable } from 'injection-js';

@Injectable()
export class PerformanceObserverFactory {
    public create(callback: PerformanceObserverCallback): PerformanceObserver {
        return new PerformanceObserver(callback);
    }
}
