import { ClassProvider, ExistingProvider, FactoryProvider, TypeProvider, ValueProvider } from './providers';

export interface AkModuleBuilder {
    with(typeProvider: TypeProvider<unknown>, ...typeProviders: Readonly<TypeProvider<unknown>[]>): AkModuleBuilder;
    withValue<T, V extends T>(provider: ValueProvider<T, V>): AkModuleBuilder;
    withClass<T, V extends T>(provider: ClassProvider<T, V>): AkModuleBuilder;
    withExisting<T, V extends T>(provider: ExistingProvider<T, V>): AkModuleBuilder;
    withFactory<T, V extends T>(provider: FactoryProvider<T, V>): AkModuleBuilder;

    bootstrap(
        typeProvider: TypeProvider<unknown>,
        ...typeProviders: Readonly<TypeProvider<unknown>[]>
    ): AkModuleBuilder;

    bootstrapValue<T, V extends T>(provider: ValueProvider<T, V>): AkModuleBuilder;
    bootstrapClass<T, V extends T>(provider: ClassProvider<T, V>): AkModuleBuilder;
    bootstrapExisting<T, V extends T>(provider: ExistingProvider<T, V>): AkModuleBuilder;
    bootstrapFactory<T, V extends T>(provider: FactoryProvider<T, V>): AkModuleBuilder;
}
