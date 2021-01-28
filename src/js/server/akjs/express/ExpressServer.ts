import express from 'express';
import http from 'http';
import { Inject, Injectable, Optional } from 'injection-js';
import { RouteMounter } from './RouteMounter';
import { OnBootstrapPostConstruct } from '../container/OnBootstrapPostConstruct';
import { OnBootstrapPreDestroy } from '../container/OnBootstrapPreDestroy';
import { AddressInfo } from 'net';
import { EnvToken } from '../core/EnvToken';
import { Logger } from '../core/Logger';

export const ENV_HTTP_SERVER_BIND_HOST = new EnvToken({
    id: 'AKJS_HTTP_SERVER_BIND_HOST',
    description: 'Host to use for binding of the express http server.',
    defaultValue: '0.0.0.0',
});

export const ENV_HTTP_SERVER_BIND_PORT = new EnvToken({
    id: 'AKJS_HTTP_SERVER_BIND_PORT',
    description: 'Port to use for binding of the express http server.',
    defaultValue: '3000',
});

@Injectable()
export class ExpressServer implements OnBootstrapPostConstruct, OnBootstrapPreDestroy {
    protected server?: http.Server;

    public constructor(
        @Inject(ENV_HTTP_SERVER_BIND_HOST) private readonly _bindHost: string,
        @Inject(ENV_HTTP_SERVER_BIND_PORT) private readonly _bindPortStr: string,
        private readonly _logger: Logger,
        @Optional() @Inject(RouteMounter) private readonly _routeMounters?: Readonly<RouteMounter[]>,
    ) {}

    public async onBootstrapPostConstruct(): Promise<void> {
        const bindPort = parseInt(this._bindPortStr);

        // Create instance of express server
        const expressServer = express();
        expressServer.set('trust proxy', true);

        // Setup routes
        if (this._routeMounters) {
            this._routeMounters.forEach((mounter) => {
                mounter.mountOnRouter(expressServer);
            });
        } else {
            this._logger.warn('No route mounters found in the IoC container for the express server.');
        }

        // Create HTTP server using express framework
        const server = http.createServer(expressServer);
        this.server = server;

        await new Promise<void>((resolve, reject) => {
            server
                .listen({
                    host: this._bindHost,
                    port: bindPort,
                })
                .once('listening', resolve)
                .once('error', reject);
        });

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const addr = <AddressInfo | null>server.address();
        if (addr !== null) {
            this._logger.info(`Listening on ${addr.family} ${addr.address}:${addr.port}.`);
        }
    }

    public async onBootstrapPreDestroy(): Promise<void> {
        const { server } = this;
        if (server) {
            this._logger.debug('Closing HTTP server.');

            await new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }
    }
}
