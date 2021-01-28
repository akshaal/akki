import { expect } from 'chai';
import { Scheduler } from './Scheduler';

describe('Scheduler', () => {
    it('must return undefined for rxjsScheduler (so we use default rxjs implementation)', () => {
        expect(new Scheduler().rxjsScheduler).to.be.equal(undefined);
    });

    it('must provide testable implementation of setTimeout/clearTimeout', (done) => {
        const service = new Scheduler();

        let cancelledCalled = false;
        service
            .setTimeout(2, () => {
                cancelledCalled = true;
            })
            .cancel();

        const tStart = new Date().getTime();

        service.setTimeout(10, () => {
            expect(cancelledCalled).to.be.equal(false);
            expect(new Date().getTime() - tStart).to.be.greaterThan(8);

            done();
        });
    });

    it('must provide testable implementation of setImmediate/clearImmediate', (done) => {
        const service = new Scheduler();

        let cancelledCalled = false;
        service
            .setImmediate(() => {
                cancelledCalled = true;
            })
            .cancel();

        const tStart = new Date().getTime();

        service.setImmediate(() => {
            expect(cancelledCalled).to.be.equal(false);
            expect(new Date().getTime() - tStart).to.be.lessThan(20);

            done();
        });
    });
});
