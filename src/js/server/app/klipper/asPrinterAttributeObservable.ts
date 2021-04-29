import deepEqual from 'deep-equal';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';

export function asPrinterAttributeObservable<T>(params: {
    attrSubj: BehaviorSubject<T>;
    disconnected$: Observable<void>;
}): Observable<T | null> {
    return merge(params.attrSubj, params.disconnected$.pipe(map(() => null))).pipe(
        distinctUntilChanged<T | null>(deepEqual),
        shareReplay({ bufferSize: 1, refCount: true }),
    );
}
