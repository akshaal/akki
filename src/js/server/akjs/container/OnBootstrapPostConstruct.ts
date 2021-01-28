import { hasProperty } from '../misc/hasProperty';

/**
 * Marker interface that tells that the given class implements lifecycle callback that is called when container is initialized,
 * Only useful on bootstrap instances.
 */
export interface OnBootstrapPostConstruct {
    /**
     * If a bootstrap has this method, then the method is called after ALL bootstrap instances are instantiated.
     * Only useful on bootstrap instances.
     */
    onBootstrapPostConstruct(): Promise<void>;
}

export function implementsOnBootstrapPostConstruct(obj: unknown): obj is OnBootstrapPostConstruct {
    return hasProperty(obj, 'onBootstrapPostConstruct') && obj.onBootstrapPostConstruct instanceof Function;
}
