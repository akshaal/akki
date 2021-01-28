import { Inject, Injectable } from 'injection-js';
import { Logger } from '../core/Logger';
import Transport from 'winston-transport';
import { LEVEL } from 'triple-beam';
import { EnvToken } from '../core/EnvToken';
import util from 'util';
import winston from 'winston';

export const ENV_DEBUG_LOG_FILE_ENABLED = new EnvToken({
    id: 'AKJS_DEBUG_LOG_FILE_ENABLED',
    description:
        "Set to 'true' to enable debug file. Default depends on node environment and it is 'false' in production and 'true' otherwise. Use this to override it.",
    defaultValue: process.env.NODE_ENV === 'production' ? 'false' : 'true',
});

export const ENV_DEBUG_LOG_FILE_MAX_SIZE_M = new EnvToken({
    id: 'AKJS_DEBUG_LOG_FILE_MAX_SIZE_M',
    description: 'Maximum size of debug log file in megabytes.',
    defaultValue: '10',
});

export const ENV_DEBUG_LOG_FILE_MAX_FILES = new EnvToken({
    id: 'AKJS_DEBUG_LOG_FILE_MAX_FILES',
    description: 'Number of debug files to keep before deleting old ones.',
    defaultValue: '10',
});

export const ENV_DEBUG_LOG_FILENAME = new EnvToken({
    id: 'AKJS_DEBUG_LOG_FILENAME',
    description: 'Filename for debug log file.',
    defaultValue: `./logs/app-debug.log`,
});

export const ENV_CONSOLE_LOG_LEVEL = new EnvToken({
    id: 'AKJS_CONSOLE_LOG_LEVEL',
    description: 'Log level for writing log message to stdout (console). Possible values: debug, info, warning, error.',
    defaultValue: 'info',
});

@Injectable()
export class WinstonLogger extends Logger {
    private readonly _logger: winston.Logger;
    private readonly _lowestLevel: string;

    public debugEventsLogged = 0;
    public infoEventsLogged = 0;
    public warnEventsLogged = 0;
    public errorEventsLogged = 0;

    public constructor(
        @Inject(ENV_DEBUG_LOG_FILE_ENABLED) debugLogFileEnabled: string,
        @Inject(ENV_CONSOLE_LOG_LEVEL) consoleLogLevel: string,
        @Inject(ENV_DEBUG_LOG_FILE_MAX_SIZE_M) debugLogFileMaxSizeMStr: string,
        @Inject(ENV_DEBUG_LOG_FILE_MAX_FILES) debugLogFileMaxFilesStr: string,
        @Inject(ENV_DEBUG_LOG_FILENAME) debugLogFilename: string,
    ) {
        super();

        const debugLogEnabled = debugLogFileEnabled === 'true';
        this._lowestLevel = debugLogEnabled ? 'debug' : consoleLogLevel;

        this._logger = winston.createLogger({
            exitOnError: false,
            transports: [
                new CountingTransport(this, this._lowestLevel),

                new winston.transports.Console({
                    level: consoleLogLevel,
                    handleExceptions: false,
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.timestamp(),
                        winston.format.align(),
                        winston.format.printf((info): string => {
                            const { timestamp, level, message, ...args } = info;
                            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                            const ts = timestamp.replace('T', ' ') as string;
                            return `${ts} [${level}]: ${message} ${formatArgs(args)}`;
                        }),
                    ),
                }),
            ],
        });

        if (debugLogEnabled) {
            this._logger.add(
                new winston.transports.File({
                    level: 'debug',
                    filename: debugLogFilename,
                    handleExceptions: false, // We use our own handler
                    maxsize: parseInt(debugLogFileMaxSizeMStr) * 1024 * 1024,
                    maxFiles: parseInt(debugLogFileMaxFilesStr),
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.align(),
                        winston.format.printf((info): string => {
                            const { timestamp, level, message, ...args } = info;
                            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                            const ts = timestamp.replace('T', ' ') as string;
                            return `${ts} [${level}]: ${message} ${formatArgs(args)}`;
                        }),
                    ),
                }),
            );
        }
    }

    public isDebugEnabled(): boolean {
        return this._lowestLevel === 'debug';
    }

    public debug(msg: string, arg?: unknown): void {
        this._logger.debug(msg, arg);
    }

    public info(msg: string, arg?: unknown): void {
        this._logger.info(msg, arg);
    }

    public warn(msg: string, arg?: unknown): void {
        this._logger.warn(msg, arg);
    }

    public error(msg: string, arg?: unknown): void {
        this._logger.error(msg, arg);
    }
}

class CountingTransport extends Transport {
    public constructor(private readonly _logger: WinstonLogger, public level: string) {
        super();
    }

    public log(info: { [key: string]: unknown }, next?: () => void): void {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        switch (info[LEVEL as any]) {
            case 'info':
                this._logger.infoEventsLogged += 1;
                break;

            case 'warn':
                this._logger.warnEventsLogged += 1;
                break;

            case 'error':
                this._logger.errorEventsLogged += 1;
                break;

            case 'debug':
                this._logger.debugEventsLogged += 1;
                break;

            default:
        }

        if (next) {
            next();
        }
    }
}

function formatArgs(args: { [key: string]: unknown }): string {
    const keys = Object.keys(args);

    if (keys.length === 1) {
        return util.inspect(args[keys[0]]);
    }

    const gargs: { [key: string]: unknown } = {};
    for (const k of keys) {
        gargs[k] = args[k];
    }

    const s = util.inspect(gargs);
    return s === '{}' ? '' : s;
}
