/* eslint-disable import/no-extraneous-dependencies */
import { join, resolve } from 'path';

import { exit } from 'process';

import { Configuration as NestCLIConfig } from '@nestjs/cli/lib/configuration';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { existsSync, readFileSync } from 'fs-extra';
import { get, omit } from 'lodash';
import { StartOptions } from 'pm2';
import ts from 'typescript';

import { Configure } from '@/modules/config/configure';
import { CLIConfig, Pm2Option } from '@/modules/core/commands/types';
import { deepMerge, panic } from '@/modules/core/helpers';
import { AppConfig } from '@/modules/core/types';

const cwdPath = resolve(__dirname, '../../../../..');

export function getCLIConfig(
    tsConfigFile: string,
    nestConfigFile: string,
    tsEntryFile?: string,
): CLIConfig {
    let tsConfig: ts.CompilerOptions = {};
    const tsConfigPath = join(cwdPath, tsConfigFile);

    if (!existsSync(tsConfigPath)) {
        panic(`ts config file ${tsConfigPath} not exists!`);
    }

    try {
        const allTsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf8'));
        tsConfig = get(allTsConfig, 'compilerOptions', {});
    } catch (error) {
        panic({ error, message: 'get ts config file failed.' });
    }
    let nestConfig: NestCLIConfig = {};
    const nestConfigPath = join(cwdPath, nestConfigFile);

    if (!existsSync(nestConfigPath)) {
        panic(`ts config file ${nestConfigPath} not exists!`);
    }

    try {
        nestConfig = JSON.parse(readFileSync(nestConfigPath, 'utf8'));
    } catch (error) {
        panic({ error, message: 'get nest config file failed.' });
    }

    const dist = get(tsConfig, 'outDir', 'dist');
    const src = get(nestConfig, 'sourceRoot', 'src');
    const homeDir = process.env.HOME;
    const paths = {
        cwd: cwdPath,
        dist,
        src,
        js: join(dist, nestConfig.entryFile ?? 'main.js'),
        ts: join(src, tsEntryFile ?? 'main.ts'),
        bun: `${homeDir}/.bun/bin/bun`,
        nest: './node_modules/@nestjs/cli/bin/nest.js',
    };

    return {
        options: { ts: tsConfig, nest: nestConfig },
        paths,
        subprocess: {
            bun: {
                cwd: cwdPath,
                stdout: 'inherit',
                env: process.env,
                onExit: (proc) => {
                    proc.kill();
                    if (!isNil(proc.exitCode)) {
                        exit(0);
                    }
                },
            },
            node: {
                cwd: cwdPath,
                env: process.env,
                stdio: 'inherit',
            },
        },
    };
}

export async function getPm2Config(
    configure: Configure,
    option: Pm2Option,
    config: CLIConfig,
    script: string,
): Promise<StartOptions> {
    const { name, pm2: customConfig = {} } = await configure.get<AppConfig>('app');
    const defaultConfig: StartOptions = {
        name,
        cwd: cwdPath,
        script,
        args: option.command,
        autorestart: true,
        watch: option.watch,
        ignore_watch: ['node_modules'],
        env: process.env,
        exec_mode: 'fork',
        interpreter: config.paths.bun,
    };

    return deepMerge(
        defaultConfig,
        omit(customConfig, ['name', 'cwd', 'script', 'args', 'watch', 'interpreter']),
        'replace',
    );
}
