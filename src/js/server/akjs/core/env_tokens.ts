import { EnvToken } from './EnvToken';

/**
 * Token that is used to provide version of the application that uses akjs.
 * This token is supposed be either overridden in an application's module or a
 * a value must be provided via environment variable.
 */
export const ENV_APP_VERSION = new EnvToken({
    id: 'AKJS_APP_VERSION',
    description: 'Version of the application.',
    defaultValue: 'unknown',
});
