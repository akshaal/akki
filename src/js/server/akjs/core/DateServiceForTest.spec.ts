import { expect } from 'chai';
import { DateServiceForTest } from './DateServiceForTest';

describe('DateServiceForTest', () => {
    it('should be useful', () => {
        let events = 0;
        let lastEventMilliseconds = -1;

        const service = new DateServiceForTest();
        service.currentMilliseconds$.subscribe((t) => {
            lastEventMilliseconds = t;
            events += 1;
        });

        expect(service.currentSeconds).to.be.equal(0);
        expect(service.currentMilliseconds).to.be.equal(0);
        expect(service.getCurrentDate()).to.deep.equal(new Date(0));
        expect(events).to.be.equal(1);
        expect(lastEventMilliseconds).to.be.equal(0);

        service.addSeconds(100);
        expect(service.currentSeconds).to.be.equal(100);
        expect(service.currentMilliseconds).to.be.equal(100000);
        expect(service.getCurrentDate()).to.deep.equal(new Date(100000));
        expect(events).to.be.equal(2);
        expect(lastEventMilliseconds).to.be.equal(100000);

        service.addMilliseconds(5);
        expect(service.currentSeconds).to.be.equal(100.005);
        expect(service.currentMilliseconds).to.be.equal(100005);
        expect(service.getCurrentDate()).to.deep.equal(new Date(100005));
        expect(events).to.be.equal(3);
        expect(lastEventMilliseconds).to.be.equal(100005);

        service.setSeconds(110);
        expect(service.currentSeconds).to.be.equal(110);
        expect(service.currentMilliseconds).to.be.equal(110000);
        expect(service.getCurrentDate()).to.deep.equal(new Date(110000));
        expect(events).to.be.equal(4);
        expect(lastEventMilliseconds).to.be.equal(110000);

        service.setSeconds(110);
        expect(service.currentSeconds).to.be.equal(110);
        expect(service.currentMilliseconds).to.be.equal(110000);
        expect(service.getCurrentDate()).to.deep.equal(new Date(110000));
        expect(events).to.be.equal(4);
        expect(lastEventMilliseconds).to.be.equal(110000);

        service.setMilliseconds(200000);
        expect(service.currentSeconds).to.be.equal(200);
        expect(service.currentMilliseconds).to.be.equal(200000);
        expect(service.getCurrentDate()).to.deep.equal(new Date(200000));
        expect(events).to.be.equal(5);
        expect(lastEventMilliseconds).to.be.equal(200000);
    });

    it('should not let go back in time', () => {
        const service = new DateServiceForTest();
        service.setSeconds(110);

        expect(() => {
            service.addSeconds(-5);
        }).to.throw("Can't go back in time, milliseconds=-5000");

        expect(() => {
            service.setSeconds(50);
        }).to.throw("Can't go back in time, new milliseconds=50000, current milliseconds=110000");

        expect(() => {
            service.addMilliseconds(-5);
        }).to.throw("Can't go back in time, milliseconds=-5");

        expect(() => {
            service.setMilliseconds(50);
        }).to.throw("Can't go back in time, new milliseconds=50, current milliseconds=110000");
    });
});
