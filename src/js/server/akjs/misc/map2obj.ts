/**
 * Converts Map object into a corresponding Object object.
 * Example:
 *   map2obj(new Map().set("a", "b")) returns {a: "b"}
 */
export function map2obj<T>(map: ReadonlyMap<string, T>): { [k: string]: T } {
    return Object.fromEntries(map.entries());
}
