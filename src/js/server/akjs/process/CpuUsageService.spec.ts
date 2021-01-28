import { expect } from 'chai';
import 'reflect-metadata';
import { CpuUsageService } from './CpuUsageService';

describe('CpuUsageService', () => {
    const cpuUsageService = new CpuUsageService();

    it('has get() method', () => {
        const v = cpuUsageService.get();
        expect(v.system).to.be.not.greaterThan(process.cpuUsage().system);
        expect(v.user).to.be.not.greaterThan(process.cpuUsage().user);
    });
});
