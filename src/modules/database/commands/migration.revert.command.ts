import { Arguments } from 'yargs';

import { CommandItem } from '@/modules/core/types';
import { MigrationRevertHandler } from '@/modules/database/commands/migration.revert.handler';
import { MigrationRevertArguments } from '@/modules/database/commands/types';

export const RevertMigrationCommand: CommandItem<any, MigrationRevertArguments> = async ({
    configure,
}) => ({
    source: true,
    command: ['db:migration:revert', 'dbmv'],
    describe: 'Reverts last executed migration.',
    builder: {
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
        },
        transaction: {
            type: 'string',
            alias: 't',
            describe:
                'Indicates if transaction should be used or not for migration run/revert/reflash. Enabled by default.',
            default: 'default',
        },
        fake: {
            type: 'boolean',
            alias: 'f',
            describe:
                'Fakes running the migrations if table schema has already been changed manually or externally ' +
                '(e.g. through another project)',
        },
    } as const,

    handler: async (args: Arguments<MigrationRevertArguments>) =>
        MigrationRevertHandler(configure, args),
});
