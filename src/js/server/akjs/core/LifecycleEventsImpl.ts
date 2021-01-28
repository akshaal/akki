import { Injectable } from 'injection-js';
import { AsyncSubject } from 'rxjs';
import { LifecycleEvents } from './LifecycleEvents';
import { OnBootstrapPostConstruct } from '../container/OnBootstrapPostConstruct';
import { OnBootstrapPreDestroy } from '../container/OnBootstrapPreDestroy';

@Injectable()
export class LifecycleEventsImpl extends LifecycleEvents implements OnBootstrapPostConstruct, OnBootstrapPreDestroy {
    // -------------------------------------------------
    private readonly _postConstructSubject$;
    private readonly _preDestroySubject$;

    public constructor() {
        const postConstructSubject$ = new AsyncSubject<void>();
        const preDestroySubject$ = new AsyncSubject<void>();

        super(postConstructSubject$, preDestroySubject$);

        this._postConstructSubject$ = postConstructSubject$;
        this._preDestroySubject$ = preDestroySubject$;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async onBootstrapPostConstruct(): Promise<void> {
        this._postConstructSubject$.next();
        this._postConstructSubject$.complete();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async onBootstrapPreDestroy(): Promise<void> {
        this._preDestroySubject$.next();
        this._preDestroySubject$.complete();
    }
}
