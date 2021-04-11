import { Inject, Injectable } from 'injection-js';
import { EnvToken } from 'server/akjs/core/EnvToken';
import { LifecycleEvents } from 'server/akjs/core/LifecycleEvents';
import { SocketObservablesService } from 'server/akjs/net/SocketObservablesService';
import * as net from 'net';
import { defer, Observable, Subject, Subscriber } from 'rxjs';
import { delay, repeatWhen } from 'rxjs/operators';
import { Logger } from 'server/akjs/core/Logger';
import { Scheduler } from 'server/akjs/core/Scheduler';

export const ENV_KLIPPER_API_UDS = new EnvToken({
    id: 'AKKI_KLIPPER_API_UDS',
    description: 'Path to Unix Data Socket (UDS/IPC) for the Klipper API endpoint.',
    defaultValue: '/tmp/klippy_uds',
});

export const ENV_KLIPPER_API_RECONNECT_DELAY_MS = new EnvToken({
    id: 'AKKI_KLIPPER_API_RECONNECT_DELAY_MS',
    description: 'Delays between reconnects to Klipper Unix Data Socket (UDS/IPC) in case of errors or disconnects.',
    defaultValue: '1000',
});

type SocketEvent =
    | { kind: 'connected'; socket: net.Socket }
    | { kind: 'closed'; error?: Error }
    | { kind: 'data'; buffer: Buffer };

// Klipper uses this byte as a separator between json requests / responses.
const SEP_BYTE = 3;
const SEP_BYTE_BUFFER = Buffer.of(SEP_BYTE);

@Injectable()
export class KlipperCommService {
    private readonly _responseSubject = new Subject<string>();
    private readonly _reconnectSubject = new Subject<void>();
    private _pendingBuffers: Buffer[] = [];
    private _currentSocket: net.Socket | undefined;

    public readonly response$: Observable<string> = this._responseSubject;
    public readonly reconnect$: Observable<void> = this._reconnectSubject;

    public constructor(
        scheduler: Scheduler,
        logger: Logger,
        lifecycleEvents: LifecycleEvents,
        socketObservablesService: SocketObservablesService,
        @Inject(ENV_KLIPPER_API_UDS) udsPath: string,
        @Inject(ENV_KLIPPER_API_RECONNECT_DELAY_MS) reconnectDelayMsStr: string,
    ) {
        const reconnectDelayMs = parseInt(reconnectDelayMsStr);

        // 'Defer' will reevaluate it's function upon each subscription
        const socketEvent$ = defer<Observable<SocketEvent>>(() => {
            return new Observable((subscriber: Subscriber<SocketEvent>) => {
                const socket = new net.Socket();
                const obs = socketObservablesService.create(socket);
                let completed = false;

                const errorSub = obs.error$.subscribe((error) => {
                    if (!completed) {
                        completed = true;
                        subscriber.next({ kind: 'closed', error });
                        subscriber.complete();
                    }
                });

                const closeSub = obs.close$.subscribe(() => {
                    if (!completed) {
                        completed = true;
                        subscriber.next({ kind: 'closed' });
                        subscriber.complete();
                    }
                });

                const endSub = obs.end$.subscribe(() => {
                    if (!socket.destroyed) {
                        socket.destroy();
                    }
                });

                const connectSub = obs.connect$.subscribe(() => {
                    subscriber.next({ kind: 'connected', socket });
                });

                const dataSub = obs.data$.subscribe((buffer) => {
                    subscriber.next({ kind: 'data', buffer });
                });

                socket.connect(udsPath);

                // Teardown function
                return (): void => {
                    dataSub.unsubscribe();
                    endSub.unsubscribe();
                    errorSub.unsubscribe();
                    closeSub.unsubscribe();
                    connectSub.unsubscribe();

                    if (!socket.destroyed) {
                        socket.destroy();
                    }
                };
            });
        }).pipe(
            repeatWhen((completed) => completed.pipe(delay(reconnectDelayMs, scheduler.rxjsScheduler))),
            lifecycleEvents.takeUntilDestroyed(),
        );

        // ---

        lifecycleEvents.postConstruct$.subscribe(() => {
            socketEvent$.subscribe((event) => {
                if (event.kind === 'closed') {
                    this._currentSocket = undefined;
                    this._pendingBuffers = [];
                    if (event.error) {
                        logger.error('Klipper API socket closed with an error', { error: event.error, udsPath });
                    }
                } else if (event.kind === 'connected') {
                    this._currentSocket = event.socket;
                    this._reconnectSubject.next();
                } else {
                    let startIdx = 0;
                    let cont = true;

                    while (cont) {
                        const sepIdx = event.buffer.indexOf(SEP_BYTE, startIdx);
                        if (sepIdx === -1) {
                            cont = false;
                        } else {
                            const slice = event.buffer.slice(startIdx, sepIdx);
                            const fullBuf =
                                this._pendingBuffers.length === 0
                                    ? slice
                                    : Buffer.concat([...this._pendingBuffers, slice]);
                            this._pendingBuffers = [];
                            startIdx = sepIdx + 1;

                            this._responseSubject.next(fullBuf.toString('utf8'));
                        }
                    }

                    if (startIdx !== event.buffer.length) {
                        this._pendingBuffers.push(event.buffer.slice(startIdx));
                    }
                }
            });
        });
    }

    public send(str: string): 'sent' | 'disconnected' {
        if (this._currentSocket) {
            this._currentSocket.write(str, 'utf8');
            this._currentSocket.write(SEP_BYTE_BUFFER);
            return 'sent';
        } else {
            return 'disconnected';
        }
    }
}
