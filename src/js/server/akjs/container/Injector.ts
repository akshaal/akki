import { Injectable, Injector as InjectionJsInjector } from 'injection-js';
import { ContainerDescription } from './ContainerDescription';
import { Token } from './Token';

/**
 * Type-safe version of Injector from 'injection-js'.
 * @see InjectionJsInjector
 */
@Injectable()
export class Injector {
    public constructor(
        private readonly _injectionJsInjector: InjectionJsInjector,
        private readonly _containerDescription: ContainerDescription,
    ) {}

    public get<T>(token: Token<T>, notFoundValue?: T): T {
        const desc = this._containerDescription.tokenDescriptionMap.get(token);

        if (desc?.multi) {
            throw Error(
                `Token is provided with multi-provider, but requested with get() method. Either use getMulti() method or fix providers for the token: ${
                    desc.name
                }: ${token.toString()}`,
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this._injectionJsInjector.get(token, notFoundValue);
    }

    public getMulti<T>(token: Token<T>, notFoundValue?: Readonly<T[]>): Readonly<T[]> {
        const desc = this._containerDescription.tokenDescriptionMap.get(token);

        if (desc && !desc.multi) {
            throw Error(
                `Token is not provided with multi-provider, but requested with getMulti() method. Either use get() method or fix providers for the token: ${
                    desc.name
                }: ${token.toString()}`,
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this._injectionJsInjector.get(token, notFoundValue);
    }

    public pushInto<T>(accum: T[], token: Token<T>): void {
        const desc = this._containerDescription.tokenDescriptionMap.get(token);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const v = this._injectionJsInjector.get(token);

        if (desc?.multi) {
            accum.push(...v);
        } else {
            accum.push(v);
        }
    }

    public getAsArray<T>(token: Token<T>): Readonly<T[]> {
        const result: T[] = [];
        this.pushInto(result, token);
        return result;
    }
}
