import deepmerge from 'deepmerge';
import { isNil } from 'lodash';

export function toBoolean(value?: string | boolean): boolean {
    if (isNil(value)) {
        return false;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    try {
        return JSON.parse(value.toLowerCase());
    } catch (error) {
        return value as unknown as boolean;
    }
}

export function toNull(value?: string | null): string | null | undefined {
    return value === null ? null : value;
}

export const deepMerge = <T, P>(
    x: Partial<T>,
    y: Partial<P>,
    arrayMode: 'replace' | 'merge' = 'merge',
) => {
    const options: deepmerge.Options = {};
    if (arrayMode === 'replace') {
        options.arrayMerge = (_d, s, _o) => s;
    } else if (arrayMode === 'merge') {
        options.arrayMerge = (_d, s, _o) => Array.from(new Set([..._d, ...s]));
    }
    return deepmerge(x, y, options) as P extends T ? T : T & P;
};

export function isAsyncFunction<T, P extends Array<any>>(
    callback: (...args: P) => T | Promise<T>,
): callback is (...args: P) => Promise<T> {
    const AsyncFunction = (async () => {}).constructor;
    return callback instanceof AsyncFunction === true;
}
