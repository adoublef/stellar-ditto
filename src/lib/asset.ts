export function assert<T extends unknown>(a: T, b: T): boolean {
    return a === b;
}
