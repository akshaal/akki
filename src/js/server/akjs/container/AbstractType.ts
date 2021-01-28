/**
 * Compatible with 'abstract class' definitions.
 */
export interface AbstractType<T> extends Function {
    prototype: T;
}
