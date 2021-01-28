let uniqId = 0;

/**
 * Like injection-js InjectionToken but this one preserves type structurally.
 * This class fixes the following problem that exists with InjectionToken from injection-js:
 * const x = new InjectionJsInjectionToken<string>("");
 * const y: InjectionJsInjectionToken<number> = x; // no compilation error, because structurally that is OK.... ;(
 */
export class InjectionToken<T> {
    protected readonly v?: T;

    // To make this class incompatible to other classes to avoid typing problems caused by importing a wrong InjectorToken..
    protected readonly akjsInjectionTokenNominalTypeDesignator: number = uniqId++;

    public constructor(public readonly id: string) {}

    public toString(): string {
        return `InjectionToken(${this.akjsInjectionTokenNominalTypeDesignator}) ${this.id}`;
    }
}
