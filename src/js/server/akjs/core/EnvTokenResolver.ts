import { Injectable } from 'injection-js';
import { DelayedLogger } from './DelayedLogger';
import { EnvToken } from './EnvToken';

@Injectable()
export class EnvTokenResolver {
    private _env?: { [key: string]: string | undefined };
    private readonly _logged: Set<EnvToken> = new Set();

    public constructor(private readonly _logger: DelayedLogger) {}

    public resolve(envToken: EnvToken): string;
    public resolve(envToken: EnvToken, mode: 'NO-DEFAULT'): string | undefined;

    public resolve(envToken: EnvToken, mode?: 'NO-DEFAULT'): string | undefined {
        if (this._env === undefined) {
            if (typeof process === 'object' && typeof process.env === 'object') {
                this._env = process.env;
                this._logger.debug("Using 'process.env' for EnvToken resolving.");
            } else {
                this._logger.warn(
                    "'process.env' is not defined. EnvToken instances will always be resolved to default values unless explicitly overridden in modules.",
                );
                this._env = {};
            }
        }

        const value = this._env[envToken.id];

        const shouldLog = !this._logged.has(envToken);
        if (shouldLog) {
            this._logged.add(envToken);
        }

        if (value !== undefined) {
            if (shouldLog) {
                this._logger.debug(`Using environment value for ${envToken.toString()}: ${envToken.defaultValue}`);
            }
            return value;
        } else {
            if (mode === 'NO-DEFAULT') {
                return undefined;
            } else {
                if (shouldLog) {
                    this._logger.debug(`Using default value for ${envToken.toString()}: ${envToken.defaultValue}`);
                }
                return envToken.defaultValue;
            }
        }
    }
}
