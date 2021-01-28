/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { expect } from 'chai';
import { anything, instance, mock, verify, when } from 'ts-mockito';
import { Scheduler, Cancellable } from '../core/Scheduler';
import { withPromiseTimeout } from './withPromiseTimeout';

describe('withPromiseTimeout', () => {
    it('should not timeout if promise resolves/rejects in time', async () => {
        const scheduler = new Scheduler();
        const x = await withPromiseTimeout(Promise.resolve(123), { msg: 'aa', seconds: 1, scheduler });
        expect(x).to.be.equal(123);

        await expect(
            withPromiseTimeout(Promise.reject(new Error('321')), { msg: 'aa', seconds: 1, scheduler }),
        ).to.be.rejectedWith('321');
    });

    it('should timeout as expected', async () => {
        const scheduler = new Scheduler();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const x = withPromiseTimeout(new Promise(() => {}), { msg: 'aa', seconds: 0.01, scheduler });

        await expect(x).to.be.rejectedWith('aa: Timed out after 0.01 seconds');
    });

    it('should cancel timeout if promise resolves/rejects in time', async () => {
        const schedulerMock = mock(Scheduler);
        const scheduler = instance(schedulerMock);

        const cancellationMocks: Cancellable[] = [];
        when(schedulerMock.setTimeout(anything(), anything())).thenCall(() => {
            const m = mock<Cancellable>();
            cancellationMocks.push(m);
            return instance(m);
        });

        const x = await withPromiseTimeout(Promise.resolve(123), { msg: 'aa', seconds: 1, scheduler });
        expect(x).to.be.equal(123);

        await expect(
            withPromiseTimeout(Promise.reject(new Error('321')), { msg: 'aa', seconds: 1, scheduler }),
        ).to.be.rejectedWith('321');

        expect(cancellationMocks.length).to.be.equal(2);
        cancellationMocks.forEach((m) => {
            verify(m.cancel()).once();
        });
    });
});
