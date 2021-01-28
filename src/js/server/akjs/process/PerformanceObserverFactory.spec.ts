/* eslint-disable @typescript-eslint/no-empty-function */

import { expect } from 'chai';
import perfHooks from 'perf_hooks';
import { PerformanceObserverFactory } from './PerformanceObserverFactory';

describe('PerformanceObserverFactory', () => {
    it('must just call new perf_hooks.PerformanceObserver(...)', () => {
        const cb = (): void => {};
        const origPerformanceObserver = perfHooks.PerformanceObserver;
        try {
            class X extends perfHooks.PerformanceObserver {
                public constructor(usedCb: perfHooks.PerformanceObserverCallback) {
                    super(usedCb);
                    expect(usedCb).to.be.equal(cb);
                }
            }
            perfHooks.PerformanceObserver = X;

            const result = new PerformanceObserverFactory().create(cb);
            expect(result).to.be.instanceOf(X);
        } finally {
            perfHooks.PerformanceObserver = origPerformanceObserver;
        }
    });
});
