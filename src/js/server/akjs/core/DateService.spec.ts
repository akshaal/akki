import 'reflect-metadata';
import { DateService } from './DateService';
import { expect } from 'chai';

describe('DateService', () => {
    const dateService = new DateService();

    it('has nowDate() method', () => {
        const d = dateService.getCurrentDate();
        expect(new Date().getTime() - d.getTime()).to.be.lessThan(1000);
    });
});
