import chalk from 'chalk';
import { isNil } from 'lodash';

import ora from 'ora';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers';
import { SeederOptions } from '@/modules/database/commands/types';
import { DBOptions } from '@/modules/database/types';
import { runSeeder } from '@/modules/database/utils';

export async function SeederHandler(configure: Configure, args: SeederOptions) {
    const cname = args.connection ?? 'default';
    const { connections = [] }: DBOptions = await configure.get<DBOptions>('database');
    const dbConfig = connections.find(({ name }) => name === cname);
    if (isNil(dbConfig)) {
        await panic(`Database connection named ${cname} not exists!`);
    }

    const runner = dbConfig.seedRunner;
    const spinner = ora('Start run seeder...');
    try {
        spinner.start();
        await runSeeder(runner, args, spinner, configure, dbConfig);
        spinner.succeed(`\n 👍 ${chalk.greenBright.underline(`Finished Seeding`)}`);
    } catch (error) {
        await panic({ spinner, message: `Run seeder failed`, error });
    }
}
