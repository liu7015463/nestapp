/* eslint-disable import/no-extraneous-dependencies */
import { join } from 'path';

import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator';
import { PluginOptions } from '@nestjs/cli/lib/configuration';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin';
import { get, isNil } from 'lodash';
import { Arguments } from 'yargs';

import { CLIConfig, StartCommandArguments } from '@/modules/core/commands/types';

export function generateSwaggerMetadata(
    args: Arguments<StartCommandArguments>,
    config: CLIConfig,
    watch: boolean,
) {
    const cliPlugins = get(config.options.nest, 'compilerOptions.plugins', []) as (
        | string
        | RecordAny
    )[];
    const swaggerPlugin = cliPlugins.find(
        (item) => item === '@nest/swagger' || (item as any).name === '@nest/swagger',
    );
    if (!isNil(swaggerPlugin) && args.typescript) {
        const srcPath = join(config.paths.cwd, config.paths.src);
        const generator = new PluginMetadataGenerator();
        let swaggerPluginOption: PluginOptions;
        if (typeof swaggerPlugin !== 'string' && 'options' in swaggerPlugin) {
            swaggerPluginOption = swaggerPlugin.options;
        }
        generator.generate({
            visitors: [new ReadonlyVisitor({ ...swaggerPluginOption, pathToSource: srcPath })],
            outputDir: srcPath,
            watch,
            tsconfigPath: args.tsConfig,
            printDiagnostics: false,
        });
    }
}
