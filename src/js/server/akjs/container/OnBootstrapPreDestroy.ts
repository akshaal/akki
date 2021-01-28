import { hasProperty } from '../misc/hasProperty';

/**
 * Marker interface that tells that the given class implements lifecycle callback that is called when container is shutting down,
 */
export interface OnBootstrapPreDestroy {
    /**
     * Called by container's shutdown method.
     */
    onBootstrapPreDestroy(): Promise<void>;
}

export function implementsOnBootstrapPreDestroy(obj: unknown): obj is OnBootstrapPreDestroy {
    return hasProperty(obj, 'onBootstrapPreDestroy') && obj.onBootstrapPreDestroy instanceof Function;
}
