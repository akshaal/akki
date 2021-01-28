import { AkModuleBuilder } from './AkModuleBuilder';
import { Provider } from './providers';

export type AKModuleBuildingCallback = (builder: AkModuleBuilder) => AkModuleBuilder;

/**
 * Type-safe presentation of a container module that consists of providers, imports and bootstrap providers.
 * How to create a module:
 * const MyModule = new AkModule(
 *     "my.module.unique.id",
 *     defs =>
 *       defs.with(InjectionClass)
 *           .withValue({provide: TOKEN, useValue: 3})
 *           .bootstrap(MyService)
 * );
 *
 * or with imported definitions (from CoreModule):
 *
 * const MyModule = new AkModule(
 *     "my.module.unique.id",
 *     [CoreModule],
 *     defs =>
 *       defs.with(InjectionClass)
 *           .withValue({provide: TOKEN, useValue: 3})
 *           .bootstrap(MyService)
 * );
 */
export class AkModule {
    private readonly _providers: Provider[] = [];
    private readonly _bootstrap: Provider[] = [];
    private readonly _imports: AkModule[] = [];

    public get providers(): Readonly<Provider[]> {
        return this._providers;
    }

    public get bootstrap(): Readonly<Provider[]> {
        return this._bootstrap;
    }

    public get imports(): Readonly<AkModule[]> {
        return this._imports;
    }

    public constructor(name: string, imports: Readonly<AkModule[]>, buildingCallback?: AKModuleBuildingCallback);

    public constructor(name: string, buildingCallback?: AKModuleBuildingCallback);

    public constructor(
        public readonly name: string,
        importsOrBuildingCallback?: Readonly<AkModule[]> | AKModuleBuildingCallback,
        buildingCallback?: AKModuleBuildingCallback,
    ) {
        if (importsOrBuildingCallback instanceof Function) {
            importsOrBuildingCallback(this._createBuilder());
        } else {
            if (importsOrBuildingCallback) {
                this._imports.push(...importsOrBuildingCallback);
            }

            if (buildingCallback) {
                buildingCallback(this._createBuilder());
            }
        }

        Object.freeze(this);
    }

    private _createBuilder(): AkModuleBuilder {
        const withProv = (prov: Provider): AkModuleBuilder => {
            this._providers.push(prov);
            return builder;
        };

        const withBootstrap = (prov: Provider): AkModuleBuilder => {
            this._bootstrap.push(prov);
            return builder;
        };

        const builder: AkModuleBuilder = {
            with: (prov, ...rest): AkModuleBuilder => {
                this._providers.push(prov);
                this._providers.push(...rest);
                return builder;
            },

            withValue: withProv,
            withClass: withProv,
            withExisting: withProv,
            withFactory: withProv,

            bootstrap: (prov, ...rest): AkModuleBuilder => {
                this._bootstrap.push(prov);
                this._bootstrap.push(...rest);
                return builder;
            },

            bootstrapValue: withBootstrap,
            bootstrapClass: withBootstrap,
            bootstrapExisting: withBootstrap,
            bootstrapFactory: withBootstrap,
        };

        return builder;
    }
}
