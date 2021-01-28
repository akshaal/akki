/**
 * Options that tunes container behavior.
 */
export interface ContainerOptions {
    /**
     * Lets wrap a promise that's created for shutdown sequence. Can be used to add a timeout or chain some other actions.
     */
    shutdownPromiseWrapper?: (promise: Promise<void>) => Promise<void>;
}
