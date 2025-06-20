import chalk from 'chalk';
import { isNil } from 'lodash';
import ora from 'ora';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers';
import { TypeormMigrationCreate } from '@/modules/database/commands/typeorm.migration.create';
import { MigrationCreateArguments } from '@/modules/database/commands/types';
import { DBOptions, TypeormOption } from '@/modules/database/types';

/**
 * 创建迁移处理器
 *
 * @param configure
 * @param args
 * @constructor
 */
export async function MigrationCreateHandler(
    configure: Configure,
    args: Arguments<MigrationCreateArguments>,
) {
    const spinner = ora('start to create migration').start();
    const cname = args.connection ?? 'default';
    try {
        const { connections = [] } = await configure.get<DBOptions>('database');
        const dbConfig: TypeormOption = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) {
            await panic(`database connection ${cname} not found`);
        }
        const runner = new TypeormMigrationCreate();
        console.log();
        await runner.handler({ name: cname, dir: dbConfig.path.migration });
        spinner.start(chalk.greenBright.underline('\n 👍 Finished create migration'));
    } catch (e) {
        await panic({ spinner, message: 'Create migration failed!', error: e });
    }
}
