import { Arguments } from 'yargs';

import { CommandItem } from '@/modules/core/types';
import { MigrationCreateHandler } from '@/modules/database/commands/migration.create.handler';
import { MigrationCreateArguments } from '@/modules/database/commands/types';

/**
 * 创建迁移
 *
 * @param configure
 * @constructor
 */
export const CreateMigrationCommand: CommandItem<any, MigrationCreateArguments> = async ({
    configure,
}) => ({
    source: true,
    command: [],
    describe: 'Creates a new migration file',
    builder: {
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
        },
        name: {
            type: 'string',
            alias: 'n',
            describe: 'Name of the migration class.',
            demandOption: true,
        },
    },
    handler: async (args: Arguments<MigrationCreateArguments>) =>
        MigrationCreateHandler(configure, args),
});
