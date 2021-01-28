// eslint-disable-next-line @typescript-eslint/ban-types
export function hasProperty<X extends {}, Y extends PropertyKey>(
    obj: X | unknown,
    prop: Y,
): obj is X & Record<Y, unknown> {
    if (typeof obj !== 'object') {
        return false;
    }

    if (obj === null) {
        return false;
    }

    return prop in obj;
}
