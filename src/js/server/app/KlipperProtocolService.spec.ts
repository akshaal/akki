/* eslint-disable @typescript-eslint/unbound-method */
import { expect } from 'chai';
import 'reflect-metadata';
import { Subject } from 'rxjs';
import { DateServiceForTest } from 'server/akjs/core/DateServiceForTest';
import { LifecycleEventsImpl } from 'server/akjs/core/LifecycleEventsImpl';
import { LoggerForTest } from 'server/akjs/core/LoggerForTest';
import { SchedulerForTest } from 'server/akjs/core/SchedulerForTest';
import { NanoIdService } from 'server/akjs/nanoid/NanoIdService';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { KlipperCommService } from './KlipperCommService';
import { KlipperProtocolService } from './KlipperProtocolService';

class Env {
    public readonly nanoIdServiceMock = mock(NanoIdService);
    public readonly commServiceMock = mock(KlipperCommService);
    public readonly logger = new LoggerForTest();
    public readonly dateService = new DateServiceForTest();
    public readonly scheduler = new SchedulerForTest(this.dateService);
    public readonly lifecycleEvents = new LifecycleEventsImpl();

    public readonly commResponse$ = new Subject<string>();
    public readonly commConnected$ = new Subject<void>();
    public readonly commDisconnected$ = new Subject<void>();

    public constructor(public readonly maxInactivityMs: number) {
        when(this.commServiceMock.connected$).thenReturn(this.commConnected$);
        when(this.commServiceMock.disconnected$).thenReturn(this.commDisconnected$);
        when(this.commServiceMock.response$).thenReturn(this.commResponse$);
    }

    public newService(): KlipperProtocolService {
        return new KlipperProtocolService(
            instance(this.commServiceMock),
            this.lifecycleEvents,
            this.scheduler,
            this.logger,
            instance(this.nanoIdServiceMock),
            `${this.maxInactivityMs}`,
        );
    }
}

describe('KlipperProtocolService', () => {
    it('not reconnect comm service if nothing started', () => {
        const env = new Env(100);
        env.newService();
        env.dateService.addSeconds(10000);
        env.scheduler.flush();
        verify(env.commServiceMock.reconnect()).never();
    });

    it('not reconnect comm service if started and then finished', async () => {
        const env = new Env(100);
        env.newService();
        await env.lifecycleEvents.onBootstrapPostConstruct();
        await env.lifecycleEvents.onBootstrapPreDestroy();
        env.dateService.addSeconds(10000);
        env.scheduler.flush();
        verify(env.commServiceMock.reconnect()).never();
    });

    it('reconnect if no response', async () => {
        const env = new Env(100);
        env.newService();
        await env.lifecycleEvents.onBootstrapPostConstruct();
        env.dateService.addSeconds(1);
        env.scheduler.flush();
        verify(env.commServiceMock.reconnect()).times(10);
        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('reconnect if no response after a response', async () => {
        const env = new Env(100);
        when(env.commServiceMock.reconnect()).thenReturn('reconnecting');

        env.newService();
        await env.lifecycleEvents.onBootstrapPostConstruct();
        env.dateService.addSeconds(1);
        verify(env.commServiceMock.reconnect()).times(10);
        env.dateService.addMilliseconds(99);
        env.commResponse$.next('{}');
        env.dateService.addSeconds(1);
        verify(env.commServiceMock.reconnect()).times(20);
        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('should do nothing until once subscribes to the request', async () => {
        const env = new Env(100);
        const service = env.newService();

        await env.lifecycleEvents.onBootstrapPostConstruct();

        service.makeKlipperRequest({ method: 'a', timeoutMs: 10 });

        verify(env.commServiceMock.send(anything())).times(0);

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('should properly format requests to klipper and not reuse ids', async () => {
        const env = new Env(100);
        when(env.nanoIdServiceMock.generate(anything())).thenReturn('abc');
        when(env.commServiceMock.send(anything())).thenReturn('disconnected');

        const service = env.newService();

        await env.lifecycleEvents.onBootstrapPostConstruct();

        let r1: unknown;
        let r2: unknown;
        const sub1 = service.makeKlipperRequest({ method: 'a', timeoutMs: 10 }).subscribe((v) => {
            r1 = v;
        });
        const sub2 = service.makeKlipperRequest({ method: 'b', params: { x: 23 }, timeoutMs: 10 }).subscribe((v) => {
            r2 = v;
        });

        expect(r1).to.be.equal('disconnected');
        expect(r2).to.be.equal('disconnected');

        expect(sub1.closed).to.equal(true);
        expect(sub2.closed).to.equal(true);

        const calls = capture(env.commServiceMock.send);
        const call0 = calls.byCallIndex(0);
        const call1 = calls.byCallIndex(1);

        expect(call0).to.deep.equal(['{"id":"abc-1","method":"a","params":{}}']);
        expect(call1).to.deep.equal(['{"id":"abc-2","method":"b","params":{"x":23}}']);

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('should survive strange and unknown responses', async () => {
        const env = new Env(100);
        env.newService();

        await env.lifecycleEvents.onBootstrapPostConstruct();

        env.commResponse$.next('wut');
        env.commResponse$.next('{}');
        env.commResponse$.next('{"id": 3}');
        env.commResponse$.next('{"id": "3"}');
        env.commResponse$.next('{"akkiSubId": 3}');
        env.commResponse$.next('{"akkiSubId": 3, "param": "x"}');
        env.commResponse$.next('{"akkiSubId": "3", "param": {}}');

        await env.lifecycleEvents.onBootstrapPreDestroy();

        expect(env.logger.events).to.deep.equal([
            {
                msg: 'Unable to parse json response',
                arg: { response: 'wut' },
                level: 'error',
            },
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{}' },
                level: 'error',
            },
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{"id": 3}' },
                level: 'error',
            },
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{"id": "3"}' },
                level: 'error',
            },
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{"akkiSubId": 3}' },
                level: 'error',
            },
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{"akkiSubId": 3, "param": "x"}' },
                level: 'error',
            },
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{"akkiSubId": "3", "param": {}}' },
                level: 'error',
            },
        ]);
    });

    it('should complete request upon a response', async () => {
        const env = new Env(100);
        when(env.nanoIdServiceMock.generate(anything())).thenReturn('abc');
        when(env.commServiceMock.send(anything())).thenReturn('sent');

        const service = env.newService();

        await env.lifecycleEvents.onBootstrapPostConstruct();

        let r1: unknown;
        let r2: unknown;
        let r3: unknown;
        const sub1 = service.makeKlipperRequest({ method: 'a', timeoutMs: 10 }).subscribe((v) => {
            r1 = v;
        });
        const sub2 = service.makeKlipperRequest({ method: 'b', timeoutMs: 10 }).subscribe((v) => {
            r2 = v;
        });
        const sub3 = service.makeKlipperRequest({ method: 'b', timeoutMs: 10 }).subscribe((v) => {
            r3 = v;
        });

        let expectedSub1Closed = false;
        let expectedSub2Closed = false;
        let expectedSub3Closed = false;
        let expectedR1: unknown = undefined;
        let expectedR2: unknown = undefined;
        let expectedR3: unknown = undefined;

        function check(): void {
            expect(sub1.closed).to.equal(expectedSub1Closed);
            expect(sub2.closed).to.equal(expectedSub2Closed);
            expect(sub3.closed).to.equal(expectedSub3Closed);
            expect(r1).to.deep.equal(expectedR1);
            expect(r2).to.deep.equal(expectedR2);
            expect(r3).to.deep.equal(expectedR3);
        }

        check();

        env.commResponse$.next('{"id": "abc-1"}');
        expectedSub1Closed = true;
        expectedR1 = { kind: 'no-reply', reason: 'Strange response' };
        check();

        env.commResponse$.next('{"id": "abc-2", "error": {"x": 3}}');
        expectedSub2Closed = true;
        expectedR2 = { kind: 'error', error: { x: 3 } };
        check();

        env.commResponse$.next('{"id": "abc-3", "result": {"x": 3}}');
        expectedSub3Closed = true;
        expectedR3 = { kind: 'result', result: { x: 3 } };
        check();

        // Check also that id is no longer known after one response
        env.commResponse$.next('{"id": "abc-3", "result": {"y": 10}}');
        check();

        expect(env.logger.events).to.deep.equal([
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{"id": "abc-1"}' },
                level: 'error',
            },
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{"id": "abc-3", "result": {"y": 10}}' },
                level: 'error',
            },
        ]);

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('handles sudden disconnect while waiting for a reply', async () => {
        const env = new Env(100);
        when(env.nanoIdServiceMock.generate(anything())).thenReturn('abc');
        when(env.commServiceMock.send(anything())).thenReturn('sent');

        const service = env.newService();

        await env.lifecycleEvents.onBootstrapPostConstruct();

        let r1: unknown;
        const sub1 = service.makeKlipperRequest({ method: 'a', timeoutMs: 10 }).subscribe((v) => {
            r1 = v;
        });
        expect(sub1.closed).to.equal(false);
        expect(r1).to.deep.equal(undefined);

        env.commDisconnected$.next();

        expect(sub1.closed).to.equal(true);
        expect(r1).to.deep.equal({ kind: 'no-reply', reason: 'Disconnected' });

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('handles response timeout', async () => {
        const env = new Env(100);
        when(env.nanoIdServiceMock.generate(anything())).thenReturn('abc');
        when(env.commServiceMock.send(anything())).thenReturn('sent');

        const service = env.newService();

        await env.lifecycleEvents.onBootstrapPostConstruct();

        let r1: unknown;
        const sub1 = service.makeKlipperRequest({ method: 'a', timeoutMs: 10 }).subscribe((v) => {
            r1 = v;
        });
        expect(sub1.closed).to.equal(false);
        expect(r1).to.deep.equal(undefined);

        env.dateService.addMilliseconds(5);

        expect(sub1.closed).to.equal(false);
        expect(r1).to.deep.equal(undefined);

        env.dateService.addMilliseconds(5);

        expect(sub1.closed).to.equal(true);
        expect(r1).to.deep.equal({ kind: 'no-reply', reason: 'Timeout' });

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('let subscribe to klipper endpoints', async () => {
        const env = new Env(100);
        when(env.nanoIdServiceMock.generate(anything())).thenReturn('abc');
        when(env.commServiceMock.send(anything())).thenReturn('sent');

        await env.lifecycleEvents.onBootstrapPostConstruct();

        const service = env.newService();

        const data: unknown[] = [];
        const sub = service.subscribeKlipper({ method: 'x', params: { y: 3 } }).subscribe((d) => {
            data.push(d);
        });
        const calls = capture(env.commServiceMock.send);
        const call0 = calls.byCallIndex(0);

        expect(call0).to.deep.equal([
            '{"id":"abc-2","method":"x","params":{"y":3,"response_template":{"akkiSubId":"abc-1"}}}',
        ]);

        expect(sub.closed).to.be.equal(false);
        expect(data).to.be.deep.equal([]);
        expect(env.logger.events).to.deep.equal([]);

        env.commResponse$.next('{"id": "abc-2", "result": {}}');
        expect(sub.closed).to.be.equal(false);
        expect(data).to.be.deep.equal([{}]);
        expect(env.logger.events).to.deep.equal([]);

        env.commResponse$.next('{"akkiSubId": "abc-1", "params": {"a":8}}');
        expect(sub.closed).to.be.equal(false);
        expect(data).to.be.deep.equal([{}, { a: 8 }]);
        expect(env.logger.events).to.deep.equal([]);

        env.dateService.addSeconds(10);

        env.commResponse$.next('{"akkiSubId": "abc-1", "params": {"a":1}}');
        expect(sub.closed).to.be.equal(false);
        expect(data).to.be.deep.equal([{}, { a: 8 }, { a: 1 }]);
        expect(env.logger.events).to.deep.equal([]);

        env.commDisconnected$.next();
        expect(sub.closed).to.be.equal(true);
        expect(data).to.be.deep.equal([{}, { a: 8 }, { a: 1 }]);
        expect(env.logger.events).to.deep.equal([]);

        env.commResponse$.next('{"akkiSubId": "abc-1", "params": {"a":99}}');
        expect(env.logger.events).to.deep.equal([
            {
                msg: 'Strange response from Klipper',
                arg: { response: '{"akkiSubId": "abc-1", "params": {"a":99}}' },
                level: 'error',
            },
        ]);

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('should handle subscription error (already disconnected)', async () => {
        const env = new Env(100);
        when(env.nanoIdServiceMock.generate(anything())).thenReturn('abc');
        when(env.commServiceMock.send(anything())).thenReturn('disconnected');

        await env.lifecycleEvents.onBootstrapPostConstruct();

        const service = env.newService();

        const data: unknown[] = [];
        const sub = service.subscribeKlipper({ method: 'x', params: { y: 3 } }).subscribe((d) => {
            data.push(d);
        });

        expect(data).to.be.deep.equal([]);
        expect(sub.closed).to.be.equal(true);
        expect(env.logger.events).to.deep.equal([
            {
                msg: 'Unable to subscribe: Klipper is already disconnected.',
                arg: { req: { method: 'x', params: { y: 3 } } },
                level: 'error',
            },
        ]);

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('should handle subscription error (reply timeout)', async () => {
        const env = new Env(100);
        when(env.nanoIdServiceMock.generate(anything())).thenReturn('abc');
        when(env.commServiceMock.send(anything())).thenReturn('sent');

        await env.lifecycleEvents.onBootstrapPostConstruct();

        const service = env.newService();

        const data: unknown[] = [];
        const sub = service.subscribeKlipper({ method: 'x' }).subscribe((d) => {
            data.push(d);
        });

        env.dateService.addSeconds(5);

        expect(data).to.be.deep.equal([]);
        expect(sub.closed).to.be.equal(true);
        expect(env.logger.events).to.deep.equal([
            {
                msg: 'Unable to subscribe: No reply from Klipper: Timeout.',
                arg: { req: { method: 'x' } },
                level: 'error',
            },
        ]);

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });

    it('should handle subscription error (error from klipper)', async () => {
        const env = new Env(100);
        when(env.nanoIdServiceMock.generate(anything())).thenReturn('abc');
        when(env.commServiceMock.send(anything())).thenReturn('sent');

        await env.lifecycleEvents.onBootstrapPostConstruct();

        const service = env.newService();

        const data: unknown[] = [];
        const sub = service.subscribeKlipper({ method: 'x' }).subscribe((d) => {
            data.push(d);
        });

        env.commResponse$.next('{"id": "abc-2", "error": {"xxx": 1}}');

        expect(data).to.be.deep.equal([]);
        expect(sub.closed).to.be.equal(true);
        expect(env.logger.events).to.deep.equal([
            {
                msg: 'Unable to subscribe: Error from Klipper.',
                arg: { req: { method: 'x' }, error: { xxx: 1 } },
                level: 'error',
            },
        ]);

        await env.lifecycleEvents.onBootstrapPreDestroy();
    });
});
