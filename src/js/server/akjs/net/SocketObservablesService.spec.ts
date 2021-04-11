import { expect } from 'chai';
import 'reflect-metadata';
import * as net from 'net';
import { FsTempService } from '../fs/FsTempService';
import { SocketObservables } from './SocketObservables';
import { SocketObservablesService } from './SocketObservablesService';
import { filter, take } from 'rxjs/operators';

function newServer(path: string, cb: (socket: net.Socket) => void): net.Server {
    const server = new net.Server();
    server.listen(path);
    server.on('connection', cb);
    return server;
}

class Monitor {
    public readonly events: unknown[] = [];
    public constructor(obs: SocketObservables) {
        obs.end$.subscribe(() => this.events.push('end'));
        obs.drain$.subscribe(() => this.events.push('drain'));
        obs.close$.subscribe(() => this.events.push('close'));
        obs.error$.subscribe((error) => this.events.push(error));
        obs.connect$.subscribe(() => this.events.push('connect'));
        obs.data$.subscribe((data) => this.events.push(data));
    }
}

describe('SocketObservablesService', () => {
    const fsTempService = new FsTempService();

    it('observables returned by create(socket) properly handle errors', async () => {
        await fsTempService.withTempDirectory('akki-net-socket-test', async (dir) => {
            const path = `${dir}/server`;
            const clientSocket = new net.Socket();
            const socketObs = new SocketObservablesService().create(clientSocket);
            const monitor = new Monitor(socketObs);

            const closeProm = socketObs.close$.pipe(take(1)).toPromise();
            const errorProm = socketObs.error$.pipe(take(1)).toPromise();

            clientSocket.connect(path);

            await errorProm;
            await closeProm;

            expect(monitor.events.length).to.be.deep.equal(2);
        });
    });

    it('provides working create(socket) method', async () => {
        await fsTempService.withTempDirectory('akki-net-socket-test', async (dir) => {
            const path = `${dir}/server`;
            const server = newServer(path, (socket) => {
                socket.on('data', (d) => {
                    if (d.toString('utf8').includes('reply2')) {
                        socket.end();
                    }
                });

                socket.write('hello');
            });
            const clientSocket = new net.Socket();
            const socketObs = new SocketObservablesService().create(clientSocket);
            const monitor = new Monitor(socketObs);

            const closeProm = socketObs.close$.pipe(take(1)).toPromise();

            const drainProm = socketObs.drain$.pipe(take(1)).toPromise();

            const helloProm = socketObs.data$
                .pipe(
                    filter((d) => d.toString('utf8') === 'hello'),
                    take(1),
                )
                .toPromise();

            clientSocket.connect(path);

            await helloProm;

            clientSocket.write('reply'.repeat(1000000));

            await drainProm;

            clientSocket.write('reply2');

            await closeProm;

            server.close();

            expect(monitor.events).to.be.deep.equal([
                'connect',
                Buffer.of(0x68, 0x65, 0x6c, 0x6c, 0x6f),
                'drain',
                'end',
                'close',
            ]);
        });
    });
});
