import { Injectable } from 'injection-js';
import { Observable, Subject } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { Logger } from '../core/Logger';
import { DebugEvent } from './DebugEvent';

function isDebugEventOfSymbol<T extends symbol>(e: DebugEvent<symbol>, s: T): e is DebugEvent<T> {
    return e.type === s;
}

/**
 * Simple event bus for debug events.
 * Broadcasts debug event if debug logging is enabled.
 * Useful in unit tests to observe/await-on some events some otherwise are not exposed.
 */
@Injectable()
export class DebugEventBus {
    private readonly _subject = new Subject<DebugEvent<symbol>>();

    public constructor(private readonly _logger: Logger) {}

    public get event$(): Observable<DebugEvent<symbol>> {
        return this._subject;
    }

    /**
     * Broadcast and log the given debug event if debug is enabled. Otherwise does nothing.
     */
    public broadcastAndLog<T extends DebugEvent<symbol>>(event: T): void {
        if (this._logger.isDebugEnabled()) {
            this._subject.next(event);
            this._logger.debug('Debug event', event);
        }
    }

    public typeEvents<T extends symbol>(type: T): Observable<DebugEvent<T>> {
        function pred(e: DebugEvent<symbol>): e is DebugEvent<T> {
            return isDebugEventOfSymbol(e, type);
        }

        return this.event$.pipe(filter<DebugEvent<symbol>, DebugEvent<T>>(pred));
    }

    public promiseEventOfType<T extends symbol>(type: T): Promise<DebugEvent<T>> {
        return this.typeEvents(type).pipe(first()).toPromise();
    }
}
