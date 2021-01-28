import { Observable } from 'rxjs';
import { ContainerDescription } from './ContainerDescription';
import { Injector } from './Injector';

export interface Container {
    /**
     * Emits an event when container has finished shutdown process.
     * This observable will complete with error if an error occurs during shutdown.
     * The observable is hot (will emit value immediately if shutdown is already finished).
     */
    readonly shutdownFinished$: Observable<void>;

    /**
     * Contains descriptions of tokens registered in the injector of the container.
     */
    readonly description: ContainerDescription;

    /**
     * Injector of the container.
     */
    readonly injector: Injector;

    /**
     * Request a shutdown of the container.
     */
    shutdown(): Promise<void>;
}
