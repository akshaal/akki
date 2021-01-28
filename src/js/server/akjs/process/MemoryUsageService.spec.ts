import { expect } from 'chai';
import 'reflect-metadata';
import { MemoryUsageService } from './MemoryUsageService';

describe('MemoryUsageService', () => {
    const memoryUsageService = new MemoryUsageService();

    it('has get() method', () => {
        const v = memoryUsageService.get();
        expect(v.external).to.be.greaterThan(0);
        expect(v.heapTotal).to.be.greaterThan(0);
        expect(v.heapUsed).to.be.greaterThan(0);
        expect(v.rss).to.be.greaterThan(0);
    });
});
