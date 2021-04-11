import { Observable } from 'rxjs';

export interface SocketObservables {
    /**
     * Emits upon an error. 'Close' event will follow.
     */
    readonly error$: Observable<Error>;

    /**
     * Emits value when socket is fully closed. Boolean indicates whether socket was closed due to a transmission error.
     */
    readonly close$: Observable<boolean>;

    /**
     * Emits when connection is established.
     */
    readonly connect$: Observable<void>;

    /**
     * Emits when data is received.
     */
    readonly data$: Observable<Buffer>;

    /**
     * Emits when write buffer becomes empty.
     */
    readonly drain$: Observable<void>;

    /**
     * Emits when other end closes connection.
     */
    readonly end$: Observable<void>;
}
