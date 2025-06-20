import { DataSource } from 'typeorm';

import { MigrationRevertOptions } from '@/modules/database/commands/types';

type HandleOptions = MigrationRevertOptions & { dataSource: DataSource };

export class TypeormMigrationRevert {
    async handler({ transaction, fake, dataSource }: HandleOptions) {
        const options = {
            transaction: dataSource.options.migrationsTransactionMode ?? 'all',
            fake,
        };
        switch (transaction) {
            case 'all':
                options.transaction = 'all';
                break;
            case 'none':
            case 'false':
                options.transaction = 'none';
                break;
            case 'each':
                options.transaction = 'each';
                break;
            default:
        }
        await dataSource.undoLastMigration(options);
    }
}
