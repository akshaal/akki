import { AsyncSubject } from 'rxjs';

/**
 * Interface for shutting of the container from withing the container itself.
 * An instance of this class can be freely injected into a class that wants to request a shutdown
 * of the container.
 */
export class ContainerShutdownInterface {
    public constructor(private readonly _shutdownRequested$: AsyncSubject<void>) {}

    /**
     * Request a shutdown of the container. Shutdown might not happen immediately in case if container
     * is just starting up at the very moment. If container is starting up, then start up process will finish
     * first and then container will shut down after start-up is finished. All lifecycle callback are honored.
     *
     * @see OnBootstrapPreDestroy to know when shutdown started (this is supposed to be used by instances managed by the container itself)
     * @see Container.shutdownFinished$ to know when container has finished shutdown (not supposed to be used from anything in the container itself)
     */
    public requestShutdown(): void {
        if (!this._shutdownRequested$.isStopped) {
            this._shutdownRequested$.next();
            this._shutdownRequested$.complete();
        }
    }
}
