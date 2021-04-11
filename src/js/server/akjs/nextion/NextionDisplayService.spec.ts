/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { DateServiceForTest } from '../core/DateServiceForTest';
import { LifecycleEventsImpl } from '../core/LifecycleEventsImpl';
import { LoggerForTest } from '../core/LoggerForTest';
import { SchedulerForTest } from '../core/SchedulerForTest';
import {
    NextionTouchEvent,
    NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT,
    NextionDisplayService,
    NEXTION_CLOSE_COMPLETED_DEBUG_EVENT,
    NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT,
    BaseNextionDisplayService,
} from './NextionDisplayService';
import { NextionInterface, openNextionPort as realOpenNextionPort } from './lib';
import { expect } from 'chai';
import { DebugEventBus } from '../debug/DebugEventBus';
import { LoggerEvent } from '../core/LoggerEvent';
import { map2obj } from '../misc/map2obj';

class Env {
    public readonly lifecycleEvents = new LifecycleEventsImpl();
    public readonly dateService = new DateServiceForTest();
    public readonly scheduler = new SchedulerForTest(this.dateService);
    public readonly logger = new LoggerForTest();
    public readonly debugEventBus = new DebugEventBus(this.logger);

    public readonly displayService = new NextionDisplayService(
        this.scheduler,
        this.lifecycleEvents,
        this.debugEventBus,
        this.logger,
        this._params.port,
        this._params.autoReopenDelayMsStr,
        this._params.autoRefreshDelayMsStr,
        this._params.openNextionPort,
    );

    public constructor(
        private readonly _params: {
            port: string;
            autoReopenDelayMsStr: string;
            autoRefreshDelayMsStr: string;
            openNextionPort: typeof realOpenNextionPort;
        },
    ) {}
}

type ErrorCbk = (error: unknown) => void;
type DisconnectCbk = () => void;
type TouchEventCbk = (data: { readonly releaseEvent: boolean }) => void;

class NextionInterfaceImpl implements NextionInterface {
    public values = new Map<string, string | number>();
    public isOpen = true;
    public writesInProgress = 0;

    public errorHandlers: ErrorCbk[] = [];
    public disconnectHandlers: DisconnectCbk[] = [];
    public touchEventHandlers: TouchEventCbk[] = [];

    public params: {
        setValueError?: Error;
        closeError?: Error;
    } = {};

    public constructor() {}

    public on(eventName: 'error', cbk: ErrorCbk): void;
    public on(eventName: 'disconnected', cbk: DisconnectCbk): void;
    public on(eventName: 'touchEvent', cbk: TouchEventCbk): void;

    public on(eventName: any, cbk: any): void {
        if (eventName === 'error') {
            this.errorHandlers.push(cbk);
        } else if (eventName === 'disconnected') {
            this.disconnectHandlers.push(cbk);
        } else {
            this.touchEventHandlers.push(cbk);
        }
    }

    public setValue(name: string, value: string | number): Promise<void> {
        this.writesInProgress += 1;

        let r: Promise<void>;
        if (this.params.setValueError) {
            r = Promise.reject(this.params.setValueError);
        } else {
            r = Promise.resolve().then(() => {
                this.values.set(name, value);
            });
        }

        return r.finally(() => {
            this.writesInProgress -= 1;
        });
    }

    public close(): Promise<void> {
        if (this.params.closeError) {
            return Promise.reject(this.params.closeError);
        }
        return Promise.resolve().then(() => {
            this.isOpen = false;
        });
    }
}

// =========================================================================================================

class TestableBaseNextionDisplayService extends BaseNextionDisplayService {
    public readonly values: { [k: string]: any } = {};

    protected setValueIfChanged(name: string, value: string | number): void {
        this.values[name] = value;
    }
}

// =========================================================================================================

describe('NextionDisplayService', () => {
    it('should work', async () => {
        let opened = 0;
        let ni: NextionInterfaceImpl;

        const env = new Env({
            port: '/dev/blah',
            autoReopenDelayMsStr: '100',
            autoRefreshDelayMsStr: '230',
            openNextionPort: (port): Promise<NextionInterface> => {
                expect(port).to.be.equal('/dev/blah');
                opened += 1;
                ni = new NextionInterfaceImpl();
                return Promise.resolve(ni);
            },
        });

        expect(ni!).to.be.equal(undefined);

        const expLogs: LoggerEvent[] = [];
        expect(env.logger.events).to.be.deep.equal(expLogs);

        // -----------------------------
        // Bootstrap
        const openNextionPortCompleted1 = env.debugEventBus.promiseEventOfType(NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT);
        await env.lifecycleEvents.onBootstrapPostConstruct();
        expect(env.logger.events).to.be.deep.equal(expLogs);

        env.scheduler.flush();
        expect(env.logger.events).to.be.deep.equal(expLogs);

        let nix = ni!;

        await openNextionPortCompleted1;

        expLogs.push(
            {
                msg: 'Connected to nextion display: /dev/blah',
                arg: undefined,
                level: 'debug',
            },
            {
                msg: 'Debug event',
                arg: {
                    type: NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT,
                    port: '/dev/blah',
                },
                level: 'debug',
            },
        );

        env.dateService.addSeconds(1000);

        expect(opened).to.be.equal(1);
        expect(nix).to.be.not.equal(undefined);
        expect(nix.isOpen).to.be.equal(true);
        expect(nix.errorHandlers.length).to.be.equal(1);
        expect(nix.disconnectHandlers.length).to.be.equal(1);
        expect(nix.touchEventHandlers.length).to.be.equal(1);

        // -----------------------------
        // Simulate error
        const closeCompleted1 = env.debugEventBus.promiseEventOfType(NEXTION_CLOSE_COMPLETED_DEBUG_EVENT);
        const err1 = Error('fff');
        nix.errorHandlers.forEach((e) => {
            e(err1);
        });
        await closeCompleted1;

        expLogs.push(
            {
                msg: 'Nextion display error',
                arg: {
                    error: err1,
                },
                level: 'error',
            },
            {
                msg: 'Debug event',
                arg: { type: NEXTION_CLOSE_COMPLETED_DEBUG_EVENT },
                level: 'debug',
            },
        );

        expect(nix.isOpen).to.be.equal(false);
        expect(env.logger.events).to.be.deep.equal(expLogs);

        const openNextionPortCompleted2 = env.debugEventBus.promiseEventOfType(NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT);
        env.dateService.addSeconds(130);
        await openNextionPortCompleted2;
        expect(nix).to.be.not.equal(ni!);
        nix = ni!;

        expect(opened).to.be.equal(2);
        expect(nix.isOpen).to.be.equal(true);
        expect(nix.errorHandlers.length).to.be.equal(1);
        expect(nix.disconnectHandlers.length).to.be.equal(1);
        expect(nix.touchEventHandlers.length).to.be.equal(1);

        expLogs.push(
            {
                msg: 'Connected to nextion display: /dev/blah',
                arg: undefined,
                level: 'debug',
            },
            {
                msg: 'Debug event',
                arg: {
                    type: NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT,
                    port: '/dev/blah',
                },
                level: 'debug',
            },
        );

        expect(nix.values).to.be.deep.equal(new Map());

        // -----------------------------
        // Write value
        const setValueCompleted1 = env.debugEventBus.promiseEventOfType(NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT);

        // Write two times to text that write does nothing if value is not changed
        env.displayService.setText({ element: 'x', value: 'a' });
        env.displayService.setText({ element: 'x', value: 'a' });

        expect(map2obj(nix.values)).to.be.deep.equal({});
        expect(env.logger.events).to.be.deep.equal(expLogs);
        expect(nix.writesInProgress).to.be.equal(1);

        await setValueCompleted1;
        expect(nix.writesInProgress).to.be.equal(0);

        expect(map2obj(nix.values)).to.be.deep.equal({ 'x.txt': '"a"' });

        expLogs.push({
            arg: {
                name: 'x.txt',
                type: NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT,
                value: '"a"',
            },
            level: 'debug',
            msg: 'Debug event',
        });

        expect(env.logger.events).to.be.deep.equal(expLogs);

        // -----------------------------
        // Auto-refresh test

        // Test that there is a delay between refreshing
        nix.values.clear();
        env.dateService.addMilliseconds(10);
        expect(nix.writesInProgress).to.be.equal(0);
        expect(map2obj(nix.values)).to.be.deep.equal({});

        const setValueCompleted2 = env.debugEventBus.promiseEventOfType(NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT);
        env.dateService.addMilliseconds(230);
        expect(nix.writesInProgress).to.be.equal(1);

        await setValueCompleted2;
        expect(nix.writesInProgress).to.be.equal(0);

        expect(map2obj(nix.values)).to.be.deep.equal({ 'x.txt': '"a"' });

        expLogs.push({
            arg: {
                name: 'x.txt',
                type: NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT,
                value: '"a"',
            },
            level: 'debug',
            msg: 'Debug event',
        });

        expect(env.logger.events).to.be.deep.equal(expLogs);

        // -----------------------------
        // Failure on write

        const e2 = Error('abc');

        nix.values.clear();
        nix.params.setValueError = e2;

        env.displayService.setText({ element: 'y', value: 'b' });
        expect(nix.writesInProgress).to.be.equal(1);
        expect(map2obj(nix.values)).to.be.deep.equal({});

        expect(env.logger.events).to.be.deep.equal(expLogs);

        const setValueCompleted3 = env.debugEventBus.promiseEventOfType(NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT);
        env.scheduler.flush();
        await setValueCompleted3;
        expect(nix.writesInProgress).to.be.equal(0);
        expect(map2obj(nix.values)).to.be.deep.equal({});

        expLogs.push(
            {
                msg: 'Failed to set value!',
                arg: {
                    name: 'y.txt',
                    value: '"b"',
                    reason: e2,
                },
                level: 'error',
            },
            {
                msg: 'Debug event',
                arg: {
                    type: NEXTION_SET_VALUE_COMPLETED_DEBUG_EVENT,
                    name: 'y.txt',
                    value: '"b"',
                },
                level: 'debug',
            },
            {
                msg: 'Debug event',
                arg: { type: NEXTION_CLOSE_COMPLETED_DEBUG_EVENT },
                level: 'debug',
            },
        );

        expect(env.logger.events).to.be.deep.equal(expLogs);
    });

    it('should try to reopen port later if open fails', async () => {
        const err = Error('x');
        let opens = 0;

        const env = new Env({
            port: '/dev/blah',
            autoReopenDelayMsStr: '1000',
            autoRefreshDelayMsStr: '23',
            openNextionPort: (): Promise<NextionInterface> => {
                opens += 1;
                return Promise.reject(err);
            },
        });

        const expLogs: LoggerEvent[] = [];
        expect(env.logger.events).to.be.deep.equal(expLogs);

        const openCompleted = env.debugEventBus.promiseEventOfType(NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT);
        expect(opens).to.be.equal(0);
        expect(env.logger.events).to.be.deep.equal(expLogs);
        await env.lifecycleEvents.onBootstrapPostConstruct();
        expect(opens).to.be.equal(0);
        env.scheduler.flush();
        expect(opens).to.be.equal(1);
        await openCompleted;
        expect(opens).to.be.equal(1);

        function addExpLogErrors(): void {
            expLogs.push(
                {
                    msg: 'Failed to connect to nextion display!',
                    arg: {
                        port: '/dev/blah',
                        reason: err,
                    },
                    level: 'error',
                },
                {
                    msg: 'Debug event',
                    arg: { type: NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT, port: '/dev/blah' },
                    level: 'debug',
                },
            );
        }

        addExpLogErrors();
        expect(env.logger.events).to.be.deep.equal(expLogs);

        let expOpens = 1;

        for (let i = 0; i < 10; i++) {
            env.dateService.addSeconds(0.5);
            expect(opens).to.be.equal(expOpens);
            expect(env.logger.events).to.be.deep.equal(expLogs);

            env.dateService.addSeconds(0.51);
            expOpens += 1;
            expect(opens).to.be.equal(expOpens);
            expect(env.logger.events).to.be.deep.equal(expLogs);

            const open2Completed = env.debugEventBus.promiseEventOfType(NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT);
            await open2Completed;
            expect(opens).to.be.equal(expOpens);

            addExpLogErrors();
            expect(env.logger.events).to.be.deep.equal(expLogs);
        }
    });

    it('should have useful setText method', () => {
        const service = new TestableBaseNextionDisplayService();
        service.setText({ element: 'a', value: 'b' });
        service.setText({ element: 'x13', value: 'zzz' });
        expect(service.values).to.be.deep.equal({ 'a.txt': 'b', 'x13.txt': 'zzz' });
    });

    it('should have useful setTextColor method', () => {
        const service = new TestableBaseNextionDisplayService();
        service.setTextColor({ element: 'a', rgbPct100: [25, 50, 75] });
        service.setTextColor({ element: 'x13', rgbPct100: [0, 20, 100] });
        service.setTextColor({ element: 'f', rgbPct100: [100, 100, 100] });
        service.setTextColor({ element: 'f2', rgbPct100: [99, 99.5, 99] });
        service.setTextColor({ element: 'b', rgbPct100: [0, 0, 0] });
        service.setTextColor({ element: 'b2', rgbPct100: [1, 0.7, 1] });
        service.setTextColor({ element: 'x1', rgbPct100: [-1, 0, 101] });

        // We round to the closest value, so online calculators that round up, we give a different results!
        expect(service.values).to.be.deep.equal({
            'a.pco': 17431,
            'x13.pco': 447,
            'f.pco': 65535,
            'f2.pco': 65535,
            'b.pco': 0,
            'b2.pco': 0,
            'x1.pco': 31,
        });
    });

    it('should have useful setPic method', () => {
        const service = new TestableBaseNextionDisplayService();
        service.setPic({ element: 1, pic: 2 });
        service.setPic({ element: 9, pic: 5 });
        expect(service.values).to.be.deep.equal({ '1.pic': 2, '9.pic': 5 });
    });

    it('should set brightness to 50% on call to setBrightnessPct100(50)', () => {
        const service = new TestableBaseNextionDisplayService();
        service.setBrightnessPct100(50);
        expect(service.values).to.be.deep.equal({ dim: 50 });
    });

    it('should set brightness to 0% on call to setBrightnessPct100(-1)', () => {
        const service = new TestableBaseNextionDisplayService();
        service.setBrightnessPct100(-1);
        expect(service.values).to.be.deep.equal({ dim: 0 });
    });

    it('should set brightness to 100% on call to setBrightnessPct100(100)', () => {
        const service = new TestableBaseNextionDisplayService();
        service.setBrightnessPct100(101);
        expect(service.values).to.be.deep.equal({ dim: 100 });
    });

    it('should emit touch events', async () => {
        let ni: NextionInterfaceImpl;

        const env = new Env({
            port: '/dev/blah',
            autoReopenDelayMsStr: '100',
            autoRefreshDelayMsStr: '230',
            openNextionPort: (port): Promise<NextionInterface> => {
                expect(port).to.be.equal('/dev/blah');
                ni = new NextionInterfaceImpl();
                return Promise.resolve(ni);
            },
        });

        const events: NextionTouchEvent[] = [];

        const sub = env.displayService.touchEvents$.subscribe((event) => {
            events.push(event);
        });

        const openCompleted = env.debugEventBus.promiseEventOfType(NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT);
        await env.lifecycleEvents.onBootstrapPostConstruct();
        env.scheduler.flush();
        await openCompleted;

        expect(events).to.be.deep.equal([]);

        const nix = ni!;

        nix.touchEventHandlers.forEach((h) => {
            h({ releaseEvent: false });
        });

        expect(events).to.be.deep.equal([{ isRelease: false }]);

        nix.touchEventHandlers.forEach((h) => {
            h({ releaseEvent: true });
        });

        expect(events).to.be.deep.equal([{ isRelease: false }, { isRelease: true }]);

        await env.lifecycleEvents.onBootstrapPreDestroy();
        expect(sub.closed).to.be.equal(true);
    });

    it('should react on disconnect events', async () => {
        let ni: NextionInterfaceImpl;

        const env = new Env({
            port: '/dev/blah',
            autoReopenDelayMsStr: '100',
            autoRefreshDelayMsStr: '230',
            openNextionPort: (port): Promise<NextionInterface> => {
                expect(port).to.be.equal('/dev/blah');
                ni = new NextionInterfaceImpl();
                return Promise.resolve(ni);
            },
        });

        const expLogs: LoggerEvent[] = [];
        expect(env.logger.events).to.be.deep.equal(expLogs);

        const openCompleted = env.debugEventBus.promiseEventOfType(NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT);
        await env.lifecycleEvents.onBootstrapPostConstruct();
        env.scheduler.flush();
        await openCompleted;

        expLogs.push(
            {
                msg: 'Connected to nextion display: /dev/blah',
                arg: undefined,
                level: 'debug',
            },
            {
                msg: 'Debug event',
                arg: {
                    type: NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT,
                    port: '/dev/blah',
                },
                level: 'debug',
            },
        );

        expect(env.logger.events).to.be.deep.equal(expLogs);

        let nix = ni!;
        expect(nix.isOpen).to.be.equal(true);

        env.dateService.addSeconds(1000);

        // -----------------------------
        // Simulate disconnect
        const closeCompleted1 = env.debugEventBus.promiseEventOfType(NEXTION_CLOSE_COMPLETED_DEBUG_EVENT);
        nix.disconnectHandlers.forEach((e) => {
            e();
        });
        await closeCompleted1;

        expLogs.push(
            {
                msg: 'Nextion display disconnected',
                level: 'error',
                arg: undefined,
            },
            {
                msg: 'Debug event',
                arg: { type: NEXTION_CLOSE_COMPLETED_DEBUG_EVENT },
                level: 'debug',
            },
        );

        expect(nix.isOpen).to.be.equal(false);
        expect(env.logger.events).to.be.deep.equal(expLogs);

        const openNextionPortCompleted2 = env.debugEventBus.promiseEventOfType(NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT);
        env.dateService.addSeconds(130);
        await openNextionPortCompleted2;
        expect(nix).to.be.not.equal(ni!);
        nix = ni!;

        expect(nix.isOpen).to.be.equal(true);

        expLogs.push(
            {
                msg: 'Connected to nextion display: /dev/blah',
                arg: undefined,
                level: 'debug',
            },
            {
                msg: 'Debug event',
                arg: {
                    type: NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT,
                    port: '/dev/blah',
                },
                level: 'debug',
            },
        );

        expect(env.logger.events).to.be.deep.equal(expLogs);
    });

    it('should handle corner case when container shutdown happens during port opening', async () => {
        let ni: NextionInterfaceImpl;

        const env = new Env({
            port: '/dev/blah',
            autoReopenDelayMsStr: '100',
            autoRefreshDelayMsStr: '230',
            openNextionPort: (port): Promise<NextionInterface> => {
                expect(port).to.be.equal('/dev/blah');
                ni = new NextionInterfaceImpl();
                return Promise.resolve(ni);
            },
        });

        const expLogs: LoggerEvent[] = [];
        expect(env.logger.events).to.be.deep.equal(expLogs);
        const openCompleted = env.debugEventBus.promiseEventOfType(NEXTION_OPEN_PORT_COMPLETED_DEBUG_EVENT);
        await env.lifecycleEvents.onBootstrapPostConstruct();
        expect(env.logger.events).to.be.deep.equal(expLogs);
        env.scheduler.flush();
        expect(env.logger.events).to.be.deep.equal(expLogs);
        await env.lifecycleEvents.onBootstrapPreDestroy();
        await openCompleted;

        env.dateService.addSeconds(10000);

        // Just to double-check...
        await openCompleted;

        const nix = ni!;
        expect(nix.isOpen).to.be.equal(false);

        const msgs = env.logger.events.map((e) => e.msg);
        msgs.sort();
        expect(msgs).to.deep.equal(['Connected to nextion display: /dev/blah', 'Debug event', 'Debug event']);
    });
});
