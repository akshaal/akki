import { ReflectiveInjector, Type } from 'injection-js';
import { Container } from './Container';
import { ContainerDescription } from './ContainerDescription';
import { TokenDescription } from './TokenDescription';
import { Injector } from './Injector';
import { AkModule } from './AkModule';
import { Provider } from './providers';
import { implementsOnBootstrapPostConstruct } from './OnBootstrapPostConstruct';
import { implementsOnBootstrapPreDestroy } from './OnBootstrapPreDestroy';
import { Token } from './Token';
import { AsyncSubject } from 'rxjs';
import { ContainerShutdownInterface } from './ContainerShutdownInterface';
import { ContainerOptions } from './ContainerOptions';

/**
 * Builder for creation of Container objects based upon set of modules. Order of modules matters.
 *
 * Although injector is immediately available, you must finish construction using method finishConstruction in order
 * to fully initialize bootstraps and create shutdown method.
 *
 * @see ContainerDescription
 * @see Container
 */
export class ContainerBuilder {
    public readonly injector: Injector;

    private _finishConstructionInvoked = false;

    private readonly _shutdownRequested$ = new AsyncSubject<void>();

    /**
     * Create a container builder for the given module.
     *
     * @param module module to build
     */
    public constructor(module: AkModule) {
        const processedModuleNames: string[] = [];
        const tokenDescriptions: TokenDescription[] = [];
        const containerDescription = new ContainerDescription(tokenDescriptions, processedModuleNames);

        // Flatten module and gather info
        const allProviders: Provider[] = [];
        const bootstrapTokens = new Set<Token<unknown>>();
        const importedModules = new WeakSet<AkModule>();
        const tokenToModuleNames = new Map<Token<unknown>, string[]>();

        inspectAndFlattenModules(
            [module],
            allProviders,
            bootstrapTokens,
            importedModules,
            processedModuleNames,
            tokenToModuleNames,
        );

        // Shutdown interface

        // Resolve providers
        const resolvedProviders = ReflectiveInjector.resolve([
            Injector,
            { provide: ContainerDescription, useValue: containerDescription },
            { provide: ContainerShutdownInterface, useValue: new ContainerShutdownInterface(this._shutdownRequested$) },
            ...allProviders,
        ]);

        // Populate tokenDescriptions that is also referenced by ContainerDescription we created
        for (const resolvedProvider of resolvedProviders) {
            const name = resolvedProvider.key.displayName;
            const multi = resolvedProvider.multiProvider;

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            const token = resolvedProvider.key.token as Token<unknown>;

            const bootstrap = bootstrapTokens.has(token);
            const moduleNames = tokenToModuleNames.get(token) ?? [];

            tokenDescriptions.push({
                name,
                token,
                multi,
                bootstrap,
                moduleNames,
            });
        }

        // Init injector
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.injector = ReflectiveInjector.fromResolvedProviders(resolvedProviders).get(Injector);
    }

    /**
     * Instantiate bootstraps in the container. Manage lifecycle on bootstraps. Return created container along with the shutdown function.
     */
    public async finishConstruction(containerOptions?: ContainerOptions): Promise<Container> {
        if (this._finishConstructionInvoked) {
            throw Error('Already constructed or constructing');
        }

        this._finishConstructionInvoked = true;

        const containerDescription = this.injector.get(ContainerDescription);

        // Instantiate bootstraps
        const bootstraps: unknown[] = [];
        containerDescription.tokenDescriptions
            .filter((desc) => desc.bootstrap)
            .forEach((desc) => {
                this.injector.pushInto(bootstraps, desc.token);
            });

        // Call onBootstrapPostConstruct and await results in parallel
        await Promise.all(
            bootstraps
                .filter(implementsOnBootstrapPostConstruct)
                .map((bootstrap) => bootstrap.onBootstrapPostConstruct()),
        );

        // Create shutdown hook and event
        const shutdownFinished$ = new AsyncSubject<void>();

        const shutdown = (): Promise<void> => {
            this.injector.get(ContainerShutdownInterface).requestShutdown();
            return shutdownFinished$.toPromise();
        };

        // React on shutdowns via shutdown interface
        this._shutdownRequested$.subscribe(() => {
            try {
                let promise: Promise<void> = Promise.all(
                    bootstraps
                        .filter(implementsOnBootstrapPreDestroy)
                        .map((bootstrap) => bootstrap.onBootstrapPreDestroy()),
                ).then();

                if (containerOptions?.shutdownPromiseWrapper) {
                    promise = containerOptions.shutdownPromiseWrapper(promise);
                }

                promise
                    .then(() => {
                        shutdownFinished$.next();
                        shutdownFinished$.complete();
                    })
                    .catch((error) => {
                        shutdownFinished$.error(error);
                    });
            } catch (error) {
                shutdownFinished$.error(error);
            }
        });

        // Return resulting container
        return {
            injector: this.injector,
            shutdown,
            description: containerDescription,
            shutdownFinished$,
        };
    }
}

function getProviderToken(provider: Provider): Token<unknown> {
    if (provider instanceof Type) {
        return provider;
    } else {
        return provider.provide;
    }
}

function isMultiProvider(provider: Provider): boolean {
    if (provider instanceof Type) {
        return false;
    } else {
        return !!provider.multi;
    }
}

function inspectAndFlattenModules(
    modules: Readonly<AkModule[]>,
    allProvidersAccum: Provider[],
    bootstrapTokensAccum: Set<Token<unknown>>,
    importedModulesAccum: WeakSet<AkModule>,
    moduleNamesAccum: string[],
    tokenToModuleNames: Map<Token<unknown>, string[]>,
): void {
    modules.forEach((module) => {
        if (!importedModulesAccum.has(module)) {
            // Do it before everything else to avoid cyclic deps
            importedModulesAccum.add(module);

            // Do imports first because they are supposed to be replaced by our definitions
            inspectAndFlattenModules(
                module.imports,
                allProvidersAccum,
                bootstrapTokensAccum,
                importedModulesAccum,
                moduleNamesAccum,
                tokenToModuleNames,
            );

            // Now we start adding imports from this module so we can add it to the list of module names.
            moduleNamesAccum.push(module.name);

            // Helper function to be used for both providers and bootstrap
            const addProvider = (provider: Provider, bootstrap = false): void => {
                allProvidersAccum.push(provider);

                const token = getProviderToken(provider);

                if (isMultiProvider(provider)) {
                    const existingModuleNames = tokenToModuleNames.get(token);

                    if (existingModuleNames) {
                        existingModuleNames.push(module.name);
                    } else {
                        tokenToModuleNames.set(token, [module.name]);
                    }

                    if (bootstrap) {
                        bootstrapTokensAccum.add(token);
                    }
                } else {
                    tokenToModuleNames.set(token, [module.name]);

                    if (bootstrap) {
                        bootstrapTokensAccum.add(token);
                    } else {
                        bootstrapTokensAccum.delete(token);
                    }
                }
            };

            // Add providers
            module.providers.forEach((p) => {
                addProvider(p);
            });

            // Add bootstraps
            module.bootstrap.forEach((provider) => {
                addProvider(provider, true);
            });
        }
    });
}
