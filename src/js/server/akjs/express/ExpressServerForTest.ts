import request from 'supertest';
import { Inject, Injectable } from 'injection-js';
import { ExpressServer } from './ExpressServer';
import { RouteMounter } from './RouteMounter';
import { Logger } from '../core/Logger';

@Injectable()
export class ExpressServerForTest extends ExpressServer {
    public constructor(logger: Logger, @Inject(RouteMounter) routeMounters: Readonly<RouteMounter[]>) {
        super('127.0.0.1', '0', logger, routeMounters);
    }

    public request(): request.SuperTest<request.Test> {
        return request(this.server);
    }
}
