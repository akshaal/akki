import { LoggedEventCounts } from './LoggedEventCounts';

export abstract class Logger {
    abstract readonly debugEventsLogged: number;
    abstract readonly infoEventsLogged: number;
    abstract readonly warnEventsLogged: number;
    abstract readonly errorEventsLogged: number;

    abstract debug(msg: string, arg?: unknown): void;
    abstract info(msg: string, arg?: unknown): void;
    abstract warn(msg: string, arg?: unknown): void;
    abstract error(msg: string, arg?: unknown): void;

    abstract isDebugEnabled(): boolean;

    public getLoggedEventCounts(): LoggedEventCounts {
        return {
            debugEventsLogged: this.debugEventsLogged,
            infoEventsLogged: this.infoEventsLogged,
            warnEventsLogged: this.warnEventsLogged,
            errorEventsLogged: this.errorEventsLogged,
        };
    }
}
