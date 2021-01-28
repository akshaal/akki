/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable rxjs/no-implicit-any-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { expect } from 'chai';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DateServiceForTest } from './DateServiceForTest';
import { SchedulerForTest } from './SchedulerForTest';

describe('Scheduler', () => {
    /*it("must return undefined for rxjsScheduler (so we use default rxjs implementation)", () => {
        expect(new Scheduler().rxjsScheduler).to.be.equal(undefined);
    })*/

    it('must provide testable implementation of setTimeout/clearTimeout', (done) => {
        const dateService = new DateServiceForTest();
        const service = new SchedulerForTest(dateService);

        let cancelledCalled = false;
        const c1 = service.setTimeout(2, () => {
            cancelledCalled = true;
        });

        dateService.addMilliseconds(1);
        expect(cancelledCalled).to.be.equal(false);
        c1.cancel();
        expect(cancelledCalled).to.be.equal(false);
        dateService.addMilliseconds(4);
        expect(cancelledCalled).to.be.equal(false);

        const tStart = new Date().getTime();
        let tCalled = false;

        const virtualTimeStart = dateService.currentMilliseconds;

        service.setTimeout(10, () => {
            tCalled = true;
            expect(new Date().getTime() - tStart).to.be.lessThan(5);
            expect(dateService.currentMilliseconds).to.be.equal(virtualTimeStart + 10);

            service.setTimeout(10, () => {
                expect(dateService.currentMilliseconds).to.be.equal(virtualTimeStart + 20);

                service.setTimeout(120, () => {
                    expect(dateService.currentMilliseconds).to.be.equal(virtualTimeStart + 140);
                    done();
                });
            });
        });

        expect(tCalled).to.be.equal(false);
        dateService.addMilliseconds(4);
        expect(tCalled).to.be.equal(false);
        dateService.addMilliseconds(40);
        expect(tCalled).to.be.equal(true);
        dateService.addMilliseconds(50);
        dateService.addMilliseconds(10);
        dateService.addMilliseconds(10);
        dateService.addMilliseconds(10);
        dateService.addMilliseconds(10);
        dateService.addMilliseconds(5);
        dateService.addMilliseconds(5);
    });

    it('must provide testable implementation of setImmediate/clearImmediate', (done) => {
        const dateService = new DateServiceForTest();
        const service = new SchedulerForTest(dateService);

        let cancelledCalled = false;
        service
            .setImmediate(() => {
                cancelledCalled = true;
            })
            .cancel();

        dateService.addMilliseconds(4);
        expect(cancelledCalled).to.be.equal(false);

        const tStart = new Date().getTime();

        service.setImmediate(() => {
            expect(cancelledCalled).to.be.equal(false);
            expect(new Date().getTime() - tStart).to.be.lessThan(10);
            expect(dateService.currentMilliseconds).to.be.equal(4);

            done();
        });

        service.flush();
    });

    it('must provide rxjs.Scheduler', () => {
        const dateService = new DateServiceForTest();
        const service = new SchedulerForTest(dateService);
        expect(service.rxjsScheduler).to.be.not.equal(undefined);
    });

    it('must detect time advancing from within a callback', () => {
        let error: any;
        const op = catchError<any, any>((err: any) => {
            error = err;
            return of();
        });

        const dateService = new DateServiceForTest();
        const service = new SchedulerForTest(dateService, op);

        service.setImmediate(() => {
            dateService.addSeconds(2);
        });

        dateService.addSeconds(1);
        expect((<Error>error).message).to.be.equal(
            "Time can't be changed from within an action managed by the scheduler!",
        );
    });
});
