/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import 'reflect-metadata';
import { TimeService } from './TimeService';
import { highResTimeToSeconds } from '../misc/HighResTime';
import { expect } from 'chai';

describe('TimeService', () => {
    const timeService = new TimeService();

    it('has elapsedHighResTimeSince() method', () => {
        expect(highResTimeToSeconds(timeService.elapsedHighResTimeSince(process.hrtime()))).to.be.lessThan(1);
        expect(highResTimeToSeconds(timeService.elapsedHighResTimeSince(process.hrtime()))).to.be.greaterThan(0);
    });

    it('has nowHighResTime() method', () => {
        expect(highResTimeToSeconds(process.hrtime(timeService.nowHighResTime() as any))).to.be.lessThan(1);
        expect(highResTimeToSeconds(process.hrtime(timeService.nowHighResTime() as any))).to.be.greaterThan(0);
    });

    it('has uptime() method', () => {
        const x = timeService.uptime();
        expect(process.uptime() - x).to.be.lessThan(1);
    });
});
