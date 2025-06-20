import { join } from 'path';

import chalk from 'chalk';
import { isNil } from 'lodash';
import ora from 'ora';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers';
import { TypeormMigrationRun } from '@/modules/database/commands/typeorm.migration.run';
import { MigrationRunArguments } from '@/modules/database/commands/types';
import { DBOptions } from '@/modules/database/types';

/**
 * 运行迁移处理器
 * @param configure
 * @param args
 * @constructor
 */
export async function MigrationRunHandler(
    configure: Configure,
    args: Arguments<MigrationRunArguments>,
) {
    const spinner = ora('Start to run migration...');
    const cname = args.connection ?? 'default';
    let dataSource: DataSource | undefined;
    try {
        spinner.start();
        const { connections = [] }: DBOptions = await configure.get<DBOptions>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) {
            await panic(`Database connection named ${cname} not exists!`);
        }
        const dropSchema = args.refresh || args.onlydrop;
        console.log();
        const runner = new TypeormMigrationRun();
        dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
        const options = {
            subscribers: [],
            synchronize: false,
            migrationsRun: false,
            dropSchema,
            logging: ['error'],
            migrations: [
                join(dbConfig.paths.migration, '**/*.ts'),
                join(dbConfig.paths.migration, '**/*.js'),
            ],
        } as any;
        if (dropSchema) {
            dataSource.setOptions(options);
            await dataSource.initialize();
            await dataSource.destroy();
            spinner.succeed(chalk.greenBright.underline('\n 👍 Finished drop database schema'));
            if (args.onlydrop) {
                process.exit();
            }
        }

        dataSource.setOptions({ ...options, dropSchema: false });
        await dataSource.initialize();
        console.log();
        await runner.handler({ dataSource, transaction: args.transaction, fake: args.fake });
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished run migrations'));
    } catch (error) {
        await panic({ spinner, message: 'Run migrations failed!', error });
    } finally {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}
