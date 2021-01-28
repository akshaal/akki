import { SchedulerLike as RxjsScheduler } from 'rxjs';

export interface Cancellable {
    cancel(): void;
}

export class Scheduler {
    public get rxjsScheduler(): undefined | RxjsScheduler {
        return undefined;
    }

    public setTimeout(milliseconds: number, fn: () => void): Cancellable {
        const handle = setTimeout(fn, milliseconds);

        return {
            cancel: (): void => {
                clearTimeout(handle);
            },
        };
    }

    public setImmediate(fn: () => void): Cancellable {
        const handle = setImmediate(fn);

        return {
            cancel: (): void => {
                clearImmediate(handle);
            },
        };
    }
}
