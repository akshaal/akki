/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-invalid-void-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { MonoTypeOperatorFunction, SchedulerLike as RxjsScheduler, timer } from 'rxjs';
import { map, share, tap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { DateServiceForTest } from './DateServiceForTest';
import { Scheduler, Cancellable } from './Scheduler';

export class SchedulerForTest extends Scheduler {
    private readonly _testScheduler: TestScheduler;
    public immediateDelay = 0;

    public constructor(dateService: DateServiceForTest, extraDateEventOp: MonoTypeOperatorFunction<void> = tap()) {
        super();

        let inSetFrame = false;

        class CustomTestScheduler extends TestScheduler {
            private _frame = 0;

            // @ts-ignore
            public get frame(): number {
                return this._frame;
            }

            public set frame(newFrame: number) {
                this._frame = newFrame;

                try {
                    inSetFrame = true;
                    if (newFrame !== dateService.currentMilliseconds) {
                        dateService.setMilliseconds(newFrame);
                    }
                } finally {
                    inSetFrame = false;
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const testScheduler = new CustomTestScheduler(<any>undefined);
        this._testScheduler = testScheduler;

        let inDateServiceSubscription = false;

        dateService.currentMilliseconds$
            .pipe(
                tap((newMilliseconds) => {
                    if (inSetFrame) {
                        return;
                    }

                    if (inDateServiceSubscription) {
                        throw Error("Time can't be changed from within an action managed by the scheduler!");
                    }

                    inDateServiceSubscription = true;

                    try {
                        testScheduler.maxFrames = newMilliseconds;
                        testScheduler.flush();
                        testScheduler.frame = newMilliseconds;
                    } finally {
                        inDateServiceSubscription = false;
                    }
                }),
                share(),
                map(() => {}),
                extraDateEventOp,
            )
            .subscribe();
    }

    // --------------------------- Test helpers ----------------

    public flush(): void {
        this._testScheduler.flush();
    }

    // --------------------------- Methods from Scheduler ----------------

    public get rxjsScheduler(): RxjsScheduler {
        return this._testScheduler;
    }

    public setTimeout(milliseconds: number, fn: () => void): Cancellable {
        const s = timer(milliseconds, this._testScheduler).subscribe(() => {
            fn();
        });

        return {
            cancel: (): void => {
                s.unsubscribe();
            },
        };
    }

    public setImmediate(fn: () => void): Cancellable {
        return this.setTimeout(this.immediateDelay, fn);
    }
}
