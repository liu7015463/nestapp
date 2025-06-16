import { Module, ModuleMetadata, Type } from '@nestjs/common';
import chalk from 'chalk';
import deepmerge from 'deepmerge';
import { isNil } from 'lodash';

import { Arguments, CommandModule } from 'yargs';

import { App, CommandCollection, PanicOption } from '../types';

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
    const { error, message, exit = true } = option;
    isNil(error) ? console.log(chalk.red(`\n❌ ${message}`)) : console.log(chalk.red(error));
    if (exit) {
        process.exit(1);
    }
}

export async function createCommands(
    factory: () => CommandCollection,
    app: Required<App>,
): Promise<CommandModule<any, any>[]> {
    const collection: CommandCollection = [...factory()];
    const commands = await Promise.all(collection.map(async (command) => command(app)));
    return commands.map((command) => ({
        ...command,
        handler: async (args: Arguments<RecordAny>) => {
            await app.container.close();
            await command.handler(args);
            if (command.instant) {
                process.exit();
            }
        },
    }));
}
