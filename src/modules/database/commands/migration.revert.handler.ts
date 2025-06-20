import { join } from 'path';

import chalk from 'chalk';
import { isNil } from 'lodash';
import ora from 'ora';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers';
import { TypeormMigrationRevert } from '@/modules/database/commands/typeorm.migration.revert';
import { MigrationRevertArguments } from '@/modules/database/commands/types';

import { DBOptions } from '@/modules/database/types';

/**
 * 移除迁移处理器
 * @param configure
 * @param args
 * @constructor
 */
export async function MigrationRevertHandler(
    configure: Configure,
    args: Arguments<MigrationRevertArguments>,
) {
    const spinner = ora('Start to revert migration...');
    const cname = args.connection ?? 'default';
    let dataSource: DataSource | undefined;
    try {
        spinner.start();
        const { connections = [] }: DBOptions = await configure.get<DBOptions>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) {
            await panic(`Database connection named ${cname} not exists!`);
        }
        console.log();
        const runner = new TypeormMigrationRevert();
        dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);

        dataSource.setOptions({
            subscribers: [],
            synchronize: false,
            migrationsRun: false,
            dropSchema: false,
            logging: ['error'],
            migrations: [
                join(dbConfig.paths.migration, '**/*.ts'),
                join(dbConfig.paths.migration, '**/*.js'),
            ],
        });
        await dataSource.initialize();
        console.log();
        await runner.handler({ dataSource, transaction: args.transaction, fake: args.fake });
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished revert migrations'));
    } catch (error) {
        await panic({ spinner, message: 'revert migrations failed!', error });
    } finally {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}
