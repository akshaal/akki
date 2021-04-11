import { expect } from 'chai';
import 'reflect-metadata';
import { Subject } from 'rxjs';
import { SocketObservablesForTest } from './SocketObservablesForTest';

describe('SocketObservablesForTest', () => {
    it('must provides accessible instances of Subject class for each event', () => {
        const obs = new SocketObservablesForTest();
        expect(obs.close$).to.be.instanceOf(Subject);
        expect(obs.error$).to.be.instanceOf(Subject);
        expect(obs.drain$).to.be.instanceOf(Subject);
        expect(obs.data$).to.be.instanceOf(Subject);
        expect(obs.connect$).to.be.instanceOf(Subject);
        expect(obs.end$).to.be.instanceOf(Subject);
    });
});
