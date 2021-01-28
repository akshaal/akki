import { EnvToken } from '../core/EnvToken';

export const ENV_SHUTDOWN_TIMEOUT_SECONDS = new EnvToken({
    id: 'AKJS_SHUTDOWN_TIMEOUT_SECONDS',
    description: 'Number of seconds to wait for graceful shutdown to complete before interrupting it .',
    defaultValue: '5',
});

export const ENV_STARTUP_TIMEOUT_SECONDS = new EnvToken({
    id: 'AKJS_STARTUP_TIMEOUT_SECONDS',
    description: 'Number of seconds to wait for startup to complete before interrupting it .',
    defaultValue: '5',
});
