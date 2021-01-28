/* eslint-disable @typescript-eslint/require-await */

import { AsyncSubject, Observable } from 'rxjs';
import { AkModule } from '../container/AkModule';
import { Container } from '../container/Container';
import { ContainerBuilder } from '../container/ContainerBuilder';
import { ConsoleLogger } from '../core/ConsoleLogger';
import { ENV_APP_VERSION } from '../core/env_tokens';
import { Logger } from '../core/Logger';
import { Scheduler } from '../core/Scheduler';
import { withPromiseTimeout } from '../misc/withPromiseTimeout';
import { ENV_SHUTDOWN_TIMEOUT_SECONDS, ENV_STARTUP_TIMEOUT_SECONDS } from './env_tokens';

export class NodeJsApp {
    private readonly _containerBuilderCreated$ = new AsyncSubject<ContainerBuilder>();
    private readonly _containerCreated$ = new AsyncSubject<Container>();

    protected logger: Logger = new ConsoleLogger();
    protected gracefulShutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGUSR1', 'SIGUSR2'];

    public constructor(private readonly _module: AkModule, private readonly _nodeJsProcess: NodeJS.Process = process) {}

    public get containerBuilderCreated$(): Observable<ContainerBuilder> {
        return this._containerBuilderCreated$;
    }

    public get containerCreated$(): Observable<Container> {
        return this._containerCreated$;
    }

    /**
     * Main entry point. Just calls runAsync and ignores the returned promise.
     */
    public run(): void {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.runAsync();
    }

    /**
     * Main entry point. Unlike run(), this one returns a promise that is resolved when container is created and the application is started.
     */
    public async runAsync(): Promise<void> {
        this.subscribeToUnhandledRejections();
        this.subscribeToUncaughtException();

        const containerBuilder = await this.createContainerBuilder();
        const startupTimeout = parseFloat(containerBuilder.injector.get(ENV_STARTUP_TIMEOUT_SECONDS));
        const scheduler = containerBuilder.injector.get(Scheduler);

        const doInTimeoutContext = async (): Promise<void> => {
            this._containerBuilderCreated$.next(containerBuilder);
            this._containerBuilderCreated$.complete();

            const container = await this.finishConstructionOfContainer(containerBuilder);
            this._containerCreated$.next(container);
            this._containerCreated$.complete();

            await this.subscribeToGracefulShutdownSignals(container);
            await this.subscribeToShutdownEvent(container);
            await this.setupLogger(container);
            await this.showStartupInfo(container);
        };

        await withPromiseTimeout(doInTimeoutContext(), {
            msg: 'Container startup',
            seconds: startupTimeout,
            scheduler,
        });
    }

    protected subscribeToUnhandledRejections(): void {
        this._nodeJsProcess.on('unhandledRejection', (reason, promise) => {
            this.onUnhandledRejection(reason, promise);
        });
    }

    protected subscribeToUncaughtException(): void {
        this._nodeJsProcess.on('uncaughtException', (error) => {
            this.onUncaughtException(error);
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onUnhandledRejection(reason: unknown | null | undefined, _promise: Promise<unknown>): void {
        try {
            this.logger.error('Unhandled rejection:', { reason });
        } finally {
            this._nodeJsProcess.exit(200);
        }
    }

    protected onUncaughtException(error: Error): void {
        try {
            this.logger.error('Uncaught exception:', { error });
        } finally {
            this._nodeJsProcess.exit(201);
        }
    }

    protected async createContainerBuilder(): Promise<ContainerBuilder> {
        return new ContainerBuilder(this._module);
    }

    protected async finishConstructionOfContainer(containerBuilder: ContainerBuilder): Promise<Container> {
        const shutdownTimeoutSeconds = parseFloat(containerBuilder.injector.get(ENV_SHUTDOWN_TIMEOUT_SECONDS));
        const scheduler = containerBuilder.injector.get(Scheduler);

        return containerBuilder.finishConstruction({
            shutdownPromiseWrapper: (promise) =>
                withPromiseTimeout(promise, {
                    msg: 'Container shutdown',
                    seconds: shutdownTimeoutSeconds,
                    scheduler,
                }),
        });
    }

    protected async subscribeToShutdownEvent(container: Container): Promise<void> {
        // The event is emitted if container is terminated some other way then by using a shutdown signal.
        // (also converting this to promise in order to handle error during shutdown using the same callback)
        container.shutdownFinished$
            .toPromise()
            .then(() => {
                this.onGracefulShutdownFinished();
            })
            .catch((error) => {
                this.onShutdownFailure(error);
            });
    }

    protected async subscribeToGracefulShutdownSignals(container: Container): Promise<void> {
        this.gracefulShutdownSignals.forEach((signal) => {
            this._nodeJsProcess.on(signal, () => {
                this.onGracefulShutdownSignal(container, signal);
            });
        });
    }

    protected onGracefulShutdownSignal(container: Container, signal: NodeJS.Signals): void {
        this.logger.info(`Stopping gracefully: ${signal}.`);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        container.shutdown();
    }

    protected async setupLogger(container: Container): Promise<void> {
        this.logger = container.injector.get(Logger);
    }

    protected async showStartupInfo(container: Container): Promise<void> {
        this.logger.info(await this.getStartupInfo(container));
    }

    protected async getStartupInfo(container: Container): Promise<string> {
        const appVersion = container.injector.get(ENV_APP_VERSION);
        const nodeEnvName = this._nodeJsProcess.env.NODE_ENV ?? 'unknown';
        return `Started version ${appVersion} in ${nodeEnvName} mode.`;
    }

    protected onGracefulShutdownFinished(): void {
        try {
            this.logger.info('Stopped.');
        } finally {
            this._nodeJsProcess.exit(0);
        }
    }

    protected onShutdownFailure(error: Error): void {
        try {
            this.logger.info('Shutdown failure:', { error });
        } finally {
            this._nodeJsProcess.exit(205);
        }
    }
}
