import chalk from 'chalk';
import { isNil, pick } from 'lodash';
import ora from 'ora';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';
import { getRandomString, panic } from '@/modules/core/helpers';
import { MigrationRunHandler } from '@/modules/database/commands/migration.run.handler';
import { TypeormMigrationGenerate } from '@/modules/database/commands/typeorm.migration.generate';
import { MigrationGenerateArguments } from '@/modules/database/commands/types';

import { DBOptions } from '../types';

export async function MigrationGenerateHandler(
    configure: Configure,
    args: Arguments<MigrationGenerateArguments>,
) {
    await MigrationRunHandler(configure, { connection: args.connection } as any);
    console.log();
    const spinner = ora('Start to generate migration');
    const cname = args.connection ?? 'default';
    try {
        spinner.start();
        console.log();
        const { connections = [] }: DBOptions = await configure.get<DBOptions>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) {
            await panic(`Database connection named ${cname} not exists!`);
        }
        console.log();
        const runner = new TypeormMigrationGenerate();
        const dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        console.log();
        await runner.handler({
            name: args.name ?? getRandomString(6),
            dir: dbConfig.paths.migration,
            dataSource,
            ...pick(args, ['pretty', 'outputJs', 'dryrun', 'check']),
        });
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished generate migration'));
        if (args.run) {
            console.log();
            await MigrationRunHandler(configure, { connection: args.connection } as any);
        }
    } catch (error) {
        await panic({ spinner, message: 'Generate migration failed!', error });
    }
}
