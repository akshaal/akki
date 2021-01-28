/* eslint-disable no-console */

import { Logger } from './Logger';

export class ConsoleLogger extends Logger {
    public debugEventsLogged = 0;
    public infoEventsLogged = 0;
    public warnEventsLogged = 0;
    public errorEventsLogged = 0;

    public isDebugEnabled(): boolean {
        return true;
    }

    public debug(msg: string, arg?: unknown): void {
        this.debugEventsLogged += 1;

        if (arg === undefined) {
            console.debug(msg);
        } else {
            console.debug(msg, arg);
        }
    }

    public info(msg: string, arg?: unknown): void {
        this.infoEventsLogged += 1;

        if (arg === undefined) {
            console.info(msg);
        } else {
            console.info(msg, arg);
        }
    }

    public warn(msg: string, arg?: unknown): void {
        this.warnEventsLogged += 1;

        if (arg === undefined) {
            console.warn(msg);
        } else {
            console.warn(msg, arg);
        }
    }

    public error(msg: string, arg?: unknown): void {
        this.errorEventsLogged += 1;

        if (arg === undefined) {
            console.error(msg);
        } else {
            console.error(msg, arg);
        }
    }
}
