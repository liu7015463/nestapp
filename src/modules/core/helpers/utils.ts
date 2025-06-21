import { Module, ModuleMetadata, Type } from '@nestjs/common';
import chalk from 'chalk';
import deepmerge from 'deepmerge';
import { isNil } from 'lodash';

import { PanicOption } from '../types';

export function toBoolean(value?: string | boolean): boolean {
    if (isNil(value)) {
        return false;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    try {
        return JSON.parse(value.toLowerCase());
    } catch {
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
    return callback instanceof AsyncFunction;
}

export function CreateModule(
    target: string | Type<any>,
    metaSetter: () => ModuleMetadata = () => ({}),
): Type<any> {
    let ModuleClass: Type<any>;
    if (typeof target === 'string') {
        ModuleClass = class {};
        Object.defineProperty(ModuleClass, 'name', { value: target });
    } else {
        ModuleClass = target;
    }
    Module(metaSetter())(ModuleClass);
    return ModuleClass;
}

export const getRandomString = (length = 10) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const totalLength = characters.length;

    for (let index = 0; index < length; index++) {
        result += characters.charAt(Math.floor(Math.random() * totalLength));
    }
    return result;
};

export async function panic(option: PanicOption | string) {
    console.log();
    if (typeof option === 'string') {
        console.log(chalk.red(`\n❌ ${option}`));
        process.exit(1);
    }
    const { error, message, spinner, exit = true } = option;
    if (isNil(error)) {
        isNil(spinner)
            ? console.log(chalk.red(`\n❌ ${message}`))
            : spinner.succeed(chalk.red(`\n❌ ${message}`));
    } else {
        isNil(spinner) ? console.log(chalk.red(error)) : spinner.fail(chalk.red(error));
    }
    if (exit) {
        process.exit(1);
    }
}

/**
 * 获取小于N的随机整数
 * @param count
 */
export function getRandomIndex(count: number) {
    return Math.floor(Math.random() * count);
}

/**
 * 从列表中获取一个随机项
 * @param list
 */
export function getRandomItemData<T extends RecordAny>(list: T[]) {
    if (isNil(list) || list.length === 0) {
        throw new Error('list is empty');
    }
    return list[getRandomIndex(list.length)];
}

/**
 * 从列表中获取多个随机项组成一个新列表
 * @param list
 */
export function getRandomListData<T extends RecordAny>(list: T[]) {
    if (isNil(list) || list.length === 0) {
        throw new Error('list is empty');
    }
    const result: T[] = [];
    for (let i = 0; i < getRandomIndex(list.length); i++) {
        const random = getRandomItemData(list);
        if (!result.find((p) => p.id === random.id)) {
            result.push(random);
        }
    }
    return result.length === 0 ? [list[0]] : result;
}
