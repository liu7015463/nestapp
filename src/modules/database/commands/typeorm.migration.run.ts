import { DataSource } from 'typeorm';

import { MigrationRunOptions } from '@/modules/database/commands/types';

type HandlerOptions = MigrationRunOptions & { dataSource: DataSource };

export class TypeormMigrationRun {
    async handler({ transaction, fake, dataSource }: HandlerOptions) {
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
        await dataSource.runMigrations(options);
    }
}
