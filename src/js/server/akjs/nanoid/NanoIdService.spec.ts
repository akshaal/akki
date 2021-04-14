import { expect } from 'chai';
import { NanoIdService } from './NanoIdService';

describe('NanoIdService', () => {
    const service = new NanoIdService();

    it('generate ids of correct size', () => {
        expect(service.generate(3).length).to.be.equal(3);
        expect(service.generate(5).length).to.be.equal(5);
        expect(service.generate(100).length).to.be.equal(100);
    });

    it('generate random ids', () => {
        expect(service.generate(20)).to.not.be.equal(service.generate(20));
    });
});
