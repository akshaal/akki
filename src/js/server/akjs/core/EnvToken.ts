import { InjectionToken } from '../container/InjectionToken';
import { FactoryProvider } from '../container/providers';
import { EnvTokenResolver } from './EnvTokenResolver';

export interface EnvTokenParams {
    readonly id: string;
    readonly description: string;
    readonly defaultValue: string;
}

export class EnvToken extends InjectionToken<string> implements EnvTokenParams {
    public readonly id: string;
    public readonly description: string;
    public readonly defaultValue: string;

    public constructor(params: EnvTokenParams) {
        super(params.id);

        this.id = params.id;
        this.description = params.description;
        this.defaultValue = params.defaultValue;
    }

    public toString(): string {
        return `EnvToken ${this.id}`;
    }

    public asFactoryProvider(): FactoryProvider<string, string> {
        return {
            provide: this,
            useFactory: (envResolver: EnvTokenResolver): string => envResolver.resolve(this),
            deps: [EnvTokenResolver],
        };
    }
}
