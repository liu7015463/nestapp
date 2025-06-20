import { DataSource } from 'typeorm';

import { MigrationGenerateOptions } from '@/modules/database/commands/types';

type HandlerOptions = MigrationGenerateOptions & { dataSource: DataSource };
export class TypeormMigrationGenerate {
    async handler(args: HandlerOptions) {}
}
