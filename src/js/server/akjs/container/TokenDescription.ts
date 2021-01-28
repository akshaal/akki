import { Token } from './Token';

/**
 * Describes a value registered/provided in the container.
 */
export interface TokenDescription {
    /**
     * "Display name" for the object.
     */
    readonly name: string;

    /**
     * Use with injector.get.
     */
    readonly token: Token<unknown>;

    /**
     * Whether this is multi-provider or not.
     */
    readonly multi: boolean;

    /**
     * Whether this token should be instantiated by container on startup or not.
     * If true, then lifecycle methods of the instantiated object are also respected.
     */
    readonly bootstrap: boolean;

    /**
     * Names of modules that provide value for the token (multiple if providers for token has 'multi' flag 'on').
     */
    readonly moduleNames: Readonly<string[]>;
}
