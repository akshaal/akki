import { Logger } from './Logger';
import { LoggerEvent } from './LoggerEvent';

export class LoggerForTest extends Logger {
    public debugEnabled = true;

    public debugMethodCalls = 0;

    public debugEventsLogged = 0;
    public infoEventsLogged = 0;
    public warnEventsLogged = 0;
    public errorEventsLogged = 0;

    public events: LoggerEvent[] = [];

    public isDebugEnabled(): boolean {
        return this.debugEnabled;
    }

    public debug(msg: string, arg?: unknown): void {
        this.debugMethodCalls += 1;

        if (this.debugEnabled) {
            this.debugEventsLogged += 1;
            this.events.push({ msg, arg, level: 'debug' });
        }
    }

    public info(msg: string, arg?: unknown): void {
        this.infoEventsLogged += 1;
        this.events.push({ msg, arg, level: 'info' });
    }

    public warn(msg: string, arg?: unknown): void {
        this.warnEventsLogged += 1;
        this.events.push({ msg, arg, level: 'warn' });
    }

    public error(msg: string, arg?: unknown): void {
        this.errorEventsLogged += 1;
        this.events.push({ msg, arg, level: 'error' });
    }
}
