import { Scheduler } from '../core/Scheduler';

export function withPromiseTimeout<T>(
    promise: Promise<T>,
    params: { msg: string; seconds: number; scheduler: Scheduler },
): Promise<T> {
    const { seconds, msg, scheduler } = params;

    let cancelFunc: () => void;
    const timeoutPromise = new Promise<never>((_, reject) => {
        const handle = scheduler.setTimeout(seconds * 1000, () => {
            reject(new Error(`${msg}: Timed out after ${seconds} seconds.`));
        });

        cancelFunc = (): void => {
            handle.cancel();
        };
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        cancelFunc();
    });
}
