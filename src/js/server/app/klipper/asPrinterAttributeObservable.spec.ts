import { expect } from 'chai';
import { BehaviorSubject, Subject } from 'rxjs';
import { asPrinterAttributeObservable } from './asPrinterAttributeObservable';

describe('asPrinterAttributeObservable', () => {
    it('should deduplicate original subject, be shared and monitor disconnects', () => {
        const accum: [string, string | null][] = [];
        const disconnected$ = new Subject<void>();
        const am = new BehaviorSubject<string | null>(null);
        const a = asPrinterAttributeObservable({ attrSubj: am, disconnected$ });
        a.subscribe((x) => {
            accum.push(['aaa', x]);
        });
        am.next(null);
        am.next('v');
        am.next('v');
        a.subscribe((x) => {
            accum.push(['bbb', x]);
        });
        am.next('v');
        am.next('z');

        disconnected$.next();
        am.next('m');
        am.next('m');
        am.next('m');
        disconnected$.next();
        disconnected$.next();
        disconnected$.next();
        expect(accum).to.be.deep.equal([
            ['aaa', null],
            ['aaa', 'v'],
            ['bbb', 'v'],
            ['aaa', 'z'],
            ['bbb', 'z'],
            ['aaa', null],
            ['bbb', null],
            ['aaa', 'm'],
            ['bbb', 'm'],
            ['aaa', null],
            ['bbb', null],
        ]);
    });
});
