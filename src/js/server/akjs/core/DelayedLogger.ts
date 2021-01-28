import { Injectable } from 'injection-js';
import { Injector } from '../container/Injector';
import { LifecycleEvents } from './LifecycleEvents';
import { Logger } from './Logger';
import { LoggerEvent } from './LoggerEvent';

/**
 * Delayed logging events until logger is really constructed. This is needed to break
 * circular dependencies like: logger depends on env-token that depends on env-toke-resolver that depends on logger.
 */
@Injectable()
export class DelayedLogger extends Logger {
    private _delayedEvents: LoggerEvent[] = [];
    private _logger?: Logger;

    public constructor(private readonly _lifecycleEvents: LifecycleEvents, injector: Injector) {
        super();

        this._lifecycleEvents.postConstruct$.subscribe(() => {
            const logger = injector.get(Logger);
            this._logger = logger;

            this._delayedEvents.forEach((event) => {
                switch (event.level) {
                    case 'debug':
                        logger.debug(event.msg, event.arg);
                        break;

                    case 'info':
                        logger.info(event.msg, event.arg);
                        break;

                    case 'warn':
                        logger.warn(event.msg, event.arg);
                        break;

                    case 'error':
                        logger.error(event.msg, event.arg);
                        break;
                }
            });

            this._delayedEvents = [];
        });
    }

    public get debugEventsLogged(): number {
        if (this._logger) {
            return this._logger.debugEventsLogged;
        } else {
            // Safest to say 0
            return 0;
        }
    }

    public get infoEventsLogged(): number {
        if (this._logger) {
            return this._logger.infoEventsLogged;
        } else {
            // Safest to say 0
            return 0;
        }
    }

    public get warnEventsLogged(): number {
        if (this._logger) {
            return this._logger.warnEventsLogged;
        } else {
            // Safest to say 0
            return 0;
        }
    }

    public get errorEventsLogged(): number {
        if (this._logger) {
            return this._logger.errorEventsLogged;
        } else {
            // Safest to say 0
            return 0;
        }
    }

    public isDebugEnabled(): boolean {
        if (this._logger) {
            return this._logger.isDebugEnabled();
        } else {
            // Safest to say that it is enabled than not.
            return true;
        }
    }

    public debug(msg: string, arg?: unknown): void {
        if (this._logger) {
            this._logger.debug(msg, arg);
        } else {
            this._delayedEvents.push({ msg, arg, level: 'debug' });
        }
    }

    public info(msg: string, arg?: unknown): void {
        if (this._logger) {
            this._logger.info(msg, arg);
        } else {
            this._delayedEvents.push({ msg, arg, level: 'info' });
        }
    }

    public warn(msg: string, arg?: unknown): void {
        if (this._logger) {
            this._logger.warn(msg, arg);
        } else {
            this._delayedEvents.push({ msg, arg, level: 'warn' });
        }
    }

    public error(msg: string, arg?: unknown): void {
        if (this._logger) {
            this._logger.error(msg, arg);
        } else {
            this._delayedEvents.push({ msg, arg, level: 'error' });
        }
    }
}
