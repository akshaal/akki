import 'reflect-metadata';
import { LifecycleEventsImpl } from './LifecycleEventsImpl';
import { Subject } from 'rxjs';
import { expect } from 'chai';

describe('LifecycleEventImpl', () => {
    let service: LifecycleEventsImpl;

    beforeEach(() => {
        service = new LifecycleEventsImpl();
    });

    it('should work', async () => {
        let postConstructions = 0;
        let preDestructions = 0;
        let subjEvents = 0;

        const postConstructSub = service.postConstruct$.subscribe(() => (postConstructions += 1));
        const preDestroySub = service.preDestroy$.subscribe(() => (preDestructions += 1));

        const subj = new Subject<void>();
        const subjSub = subj.pipe(service.takeUntilDestroyed()).subscribe(() => (subjEvents += 1));

        expect(postConstructions).to.equal(0);
        expect(preDestructions).to.equal(0);
        expect(subjEvents).to.equal(0);
        expect(service.containerConstructed).to.equal(false);
        expect(service.containerDestroyed).to.equal(false);
        expect(postConstructSub.closed).to.equal(false);
        expect(preDestroySub.closed).to.equal(false);
        expect(subjSub.closed).to.equal(false);
        expect(subj.observers).to.have.length(1);

        subj.next();
        subj.next();

        expect(postConstructions).to.equal(0);
        expect(preDestructions).to.equal(0);
        expect(subjEvents).to.equal(2);
        expect(service.containerConstructed).to.equal(false);
        expect(service.containerDestroyed).to.equal(false);
        expect(postConstructSub.closed).to.equal(false);
        expect(preDestroySub.closed).to.equal(false);
        expect(subjSub.closed).to.equal(false);
        expect(subj.observers).to.have.length(1);

        await service.onBootstrapPostConstruct();

        expect(postConstructions).to.equal(1);
        expect(preDestructions).to.equal(0);
        expect(subjEvents).to.equal(2);
        expect(service.containerConstructed).to.equal(true);
        expect(service.containerDestroyed).to.equal(false);
        expect(postConstructSub.closed).to.equal(true);
        expect(preDestroySub.closed).to.equal(false);
        expect(subjSub.closed).to.equal(false);
        expect(subj.observers).to.have.length(1);

        subj.next();
        subj.next();
        subj.next();

        expect(postConstructions).to.equal(1);
        expect(preDestructions).to.equal(0);
        expect(subjEvents).to.equal(5);
        expect(service.containerConstructed).to.equal(true);
        expect(service.containerDestroyed).to.equal(false);
        expect(postConstructSub.closed).to.equal(true);
        expect(preDestroySub.closed).to.equal(false);
        expect(subjSub.closed).to.equal(false);
        expect(subj.observers).to.have.length(1);

        await service.onBootstrapPreDestroy();

        expect(postConstructions).to.equal(1);
        expect(preDestructions).to.equal(1);
        expect(subjEvents).to.equal(5);
        expect(service.containerConstructed).to.equal(true);
        expect(service.containerDestroyed).to.equal(true);
        expect(postConstructSub.closed).to.equal(true);
        expect(preDestroySub.closed).to.equal(true);
        expect(subjSub.closed).to.equal(true);
        expect(subj.observers).to.have.length(0);

        subj.next();

        expect(postConstructions).to.equal(1);
        expect(preDestructions).to.equal(1);
        expect(subjEvents).to.equal(5);
        expect(service.containerConstructed).to.equal(true);
        expect(service.containerDestroyed).to.equal(true);
        expect(postConstructSub.closed).to.equal(true);
        expect(preDestroySub.closed).to.equal(true);
        expect(subjSub.closed).to.equal(true);
        expect(subj.observers).to.have.length(0);
    });
});
