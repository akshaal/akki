/* eslint-disable @typescript-eslint/ban-types */

import { Type } from 'injection-js';
import { Token } from './Token';

export type TypeProvider<T> = Type<T>;

export interface ValueProvider<T, V extends T> {
    provide: Token<T>;
    useValue: V;
    multi?: boolean;
}

export interface ClassProvider<T, V extends T> {
    provide: Token<T>;
    useClass: Type<V>;
    multi?: boolean;
}

export interface ExistingProvider<T, V extends T> {
    provide: Token<T>;
    useExisting: Token<V>;
    multi?: boolean;
}

export interface FactoryProvider<T, V extends T> {
    provide: Token<T>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFactory: (...a: any[]) => V;
    deps?: unknown[];
    multi?: boolean;
}

export type Provider =
    | TypeProvider<unknown>
    | ValueProvider<unknown, unknown>
    | ClassProvider<unknown, unknown>
    | ExistingProvider<unknown, unknown>
    | FactoryProvider<unknown, unknown>;
