/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import * as net from 'net';
import 'reflect-metadata';
import { DateServiceForTest } from 'server/akjs/core/DateServiceForTest';
import { LifecycleEventsImpl } from 'server/akjs/core/LifecycleEventsImpl';
import { LoggerEvent } from 'server/akjs/core/LoggerEvent';
import { LoggerForTest } from 'server/akjs/core/LoggerForTest';
import { SchedulerForTest } from 'server/akjs/core/SchedulerForTest';
import { SocketObservables } from 'server/akjs/net/SocketObservables';
import { SocketObservablesForTest } from 'server/akjs/net/SocketObservablesForTest';
import { KlipperCommService } from './KlipperCommService';

describe('KlipperCommService', () => {
    it('should work', async () => {
        let sockObsCreated = 0;
        let connectCalled = 0;
        let destroyed = 0;

        const writes: any[] = [];

        const dateService = new DateServiceForTest();
        const scheduler = new SchedulerForTest(dateService);
        const logger = new LoggerForTest();
        const lifecycleEvents = new LifecycleEventsImpl();
        const obs1 = new SocketObservablesForTest();
        const obs2 = new SocketObservablesForTest();
        const obs3 = new SocketObservablesForTest();
        const socketObservablesService = {
            create: (socket: net.Socket): SocketObservables => {
                socket.connect = (path: any): net.Socket => {
                    expect(path).to.be.equal('/a/b');
                    connectCalled += 1;
                    return socket;
                };
                socket.write = (data: any): boolean => {
                    writes.push(data);
                    return true;
                };
                socket.destroy = (): void => {
                    destroyed += 1;
                };
                sockObsCreated += 1;
                expect(socket).not.equal(undefined);
                if (sockObsCreated === 1) {
                    return obs1;
                } else if (sockObsCreated === 2) {
                    return obs2;
                }
                return obs3;
            },
        };

        const events: string[] = [];

        const service = new KlipperCommService(
            scheduler,
            logger,
            lifecycleEvents,
            socketObservablesService,
            '/a/b',
            '100',
        );
        service.reconnect$.subscribe(() => events.push('reconnect'));
        service.response$.subscribe((txt) => events.push(`response: ${txt}`));

        const expectedWrites: any[] = [];
        const expectedEvents: string[] = [];
        const expectedLogEvents: LoggerEvent[] = [];
        let expectConnectCalled = 0;
        let expectSockObsCreated = 0;
        let expectedDestroyed = 0;

        function check(): void {
            expect(destroyed).to.equal(expectedDestroyed);
            expect(connectCalled).to.equal(expectConnectCalled);
            expect(sockObsCreated).to.equal(expectSockObsCreated);
            expect(writes).to.deep.equal(expectedWrites);
            expect(events).to.deep.equal(expectedEvents);
            expect(logger.events).to.deep.equal(expectedLogEvents);
        }

        // bootstrap

        await lifecycleEvents.onBootstrapPostConstruct();

        expectConnectCalled = 1;
        expectSockObsCreated = 1;
        check();

        // connect
        obs1.connect$.next();

        expectedEvents.push('reconnect');
        check();

        // clock
        dateService.addSeconds(10000);
        scheduler.flush();
        check();

        // data
        obs1.data$.next(Buffer.from('te', 'utf8'));
        check();

        obs1.data$.next(Buffer.from('xt2', 'utf8'));
        check();

        obs1.data$.next(Buffer.of(3, 50, 0x20, 50));
        expectedEvents.push('response: text2');
        check();

        obs1.data$.next(Buffer.of(3));
        expectedEvents.push('response: 2 2');
        check();

        // write
        expectedWrites.push('abc', Buffer.of(3));
        expect(service.send('abc')).to.be.equal('sent');
        check();

        expectedWrites.push('xxxxx', Buffer.of(3));
        expect(service.send('xxxxx')).to.be.equal('sent');
        check();

        // error
        const error1 = new Error('test');
        obs1.error$.next(error1);

        expectedLogEvents.push({
            level: 'error',
            arg: { error: error1, udsPath: '/a/b' },
            msg: 'Klipper API socket closed with an error'
        });

        expectedDestroyed += 1;
        check();        

        obs1.close$.next(true);
        check();

        // some time after error
        dateService.addMilliseconds(50);
        check();

        // no way to send something in disconnected mode
        expect(service.send('abc')).to.be.equal('disconnected');

        // reconnect time
        dateService.addMilliseconds(51);
        expectConnectCalled += 1;
        expectSockObsCreated += 1;
        check();

        // socket2 connected
        obs2.connect$.next();
        expectedEvents.push('reconnect');
        check();

        expectedWrites.push('abc5', Buffer.of(3));
        expect(service.send('abc5')).to.be.equal('sent');
        check();

        // disconnect (remote site closed it)
        obs2.end$.next();
        expectedDestroyed += 1;
        check();

        obs2.close$.next(false);
        expectedDestroyed += 1;
        check();

        expect(service.send('abc')).to.be.equal('disconnected');
        check();

        // some time after error
        dateService.addMilliseconds(50);
        check();

        // no way to send something in disconnected mode
        expect(service.send('abc')).to.be.equal('disconnected');

        // reconnect time
        dateService.addMilliseconds(51);
        expectConnectCalled += 1;
        expectSockObsCreated += 1;
        check();

        // socket3 connected
        obs3.connect$.next();
        expectedEvents.push('reconnect');
        check();

        // Teardown everything
        await lifecycleEvents.onBootstrapPreDestroy();
        expectedDestroyed += 1;
        check();
    });
});
