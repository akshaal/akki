import { SocketObservables } from './SocketObservables';
import * as net from 'net';
import { fromEvent } from 'rxjs';
import { Injectable } from 'injection-js';

export class SocketObservablesImpl implements SocketObservables {
    public readonly error$ = fromEvent<Error>(this._socket, 'error');
    public readonly close$ = fromEvent<boolean>(this._socket, 'close');
    public readonly connect$ = fromEvent<void>(this._socket, 'connect');
    public readonly drain$ = fromEvent<void>(this._socket, 'drain');
    public readonly end$ = fromEvent<void>(this._socket, 'end');
    public readonly data$ = fromEvent<Buffer>(this._socket, 'data');

    public constructor(private readonly _socket: net.Socket) {}
}

@Injectable()
export class SocketObservablesService {
    public create(socket: net.Socket): SocketObservables {
        return new SocketObservablesImpl(socket);
    }
}
