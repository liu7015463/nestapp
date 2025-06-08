import dotenv from 'dotenv';
import { findUpSync } from 'find-up';
import { readFileSync } from 'fs-extra';
import { isFunction, isNil } from 'lodash';

import { EnvironmentType } from '@/modules/config/constants';

export class Env {
    async load() {
        if (isNil(process.env.NODE_ENV)) {
            process.env.NODE_ENV = EnvironmentType.DEVELOPMENT;
        }
        const envs = [findUpSync(['.env'])];
        if (this.isDev()) {
            envs.push(
                findUpSync([`.env.${EnvironmentType.DEVELOPMENT}`, `.env.${EnvironmentType.DEV}`]),
            );
        } else if (this.isProd) {
            envs.push(
                findUpSync([`.env.${EnvironmentType.PRODUCTION}`, `.env.${EnvironmentType.PROD}`]),
            );
        } else {
            envs.push(findUpSync([`.env.${this.run()}`]));
        }

        const envFiles = envs.filter((file) => !isNil(file)) as string[];
        const fileEnvs = envFiles
            .map((file) => dotenv.parse(readFileSync(file)))
            .reduce((o, n) => ({ ...o, ...n }), {});
        const envConfig = { ...process.env, ...fileEnvs };
        const envKeys = Object.keys(envConfig).filter((key) => !(key in process.env));
        envKeys.forEach((key) => {
            process.env[key] = envConfig[key];
        });
    }

    run() {
        return process.env.NODE_ENV as EnvironmentType & RecordAny;
    }

    isProd() {
        return this.run() === EnvironmentType.PRODUCTION || this.run() === EnvironmentType.PROD;
    }

    isDev() {
        return this.run() === EnvironmentType.DEVELOPMENT || this.run() === EnvironmentType.DEV;
    }

    get(): { [key: string]: string };

    get<T extends BaseType = string>(key: string): T;

    get<T extends BaseType = string>(key: string, parseTo?: ParseType<T>): T;

    get<T extends BaseType = string>(key: string, defaultValue?: T): T;

    get<T extends BaseType = string>(key: string, parseTo?: ParseType<T>, defaultValue?: T): T;

    get<T extends BaseType = string>(key?: string, parseTo?: ParseType<T> | T, defaultValue?: T) {
        if (!key) {
            return process.env;
        }
        const value = process.env[key];
        if (value !== undefined) {
            if (parseTo && isFunction(parseTo)) {
                return parseTo(value);
            }
            return value as T;
        }
        if (parseTo === undefined && defaultValue === undefined) {
            return undefined;
        }
        if (parseTo && defaultValue === undefined) {
            return isFunction(parseTo) ? undefined : parseTo;
        }
        return defaultValue! as T;
    }
}
