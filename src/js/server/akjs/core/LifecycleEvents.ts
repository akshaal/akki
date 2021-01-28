import { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export abstract class LifecycleEvents {
    private _containerConstructed = false;
    private _containerDestroyed = false;

    public constructor(
        public readonly postConstruct$: Observable<void>,
        public readonly preDestroy$: Observable<void>,
    ) {
        postConstruct$.subscribe(() => (this._containerConstructed = true));
        preDestroy$.subscribe(() => (this._containerDestroyed = true));
    }

    public takeUntilDestroyed<T>(): MonoTypeOperatorFunction<T> {
        return takeUntil(this.preDestroy$);
    }

    public get containerConstructed(): boolean {
        return this._containerConstructed;
    }

    public get containerDestroyed(): boolean {
        return this._containerDestroyed;
    }
}
