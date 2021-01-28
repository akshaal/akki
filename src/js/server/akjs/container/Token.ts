import { Type } from 'injection-js';
import { AbstractType } from './AbstractType';
import { InjectionToken } from './InjectionToken';

export type Token<T> = Type<T> | AbstractType<T> | InjectionToken<T>;
