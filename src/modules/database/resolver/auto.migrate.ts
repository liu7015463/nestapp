import { join } from 'path';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { DataSource, DataSourceOptions } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers';
import { TypeormMigrationRun } from '@/modules/database/commands/typeorm.migration.run';
import { DBOptions } from '@/modules/database/types';

@Injectable()
export class AutoMigrateResolver implements OnModuleInit {
    constructor(private ref: ModuleRef) {}

    async onModuleInit() {
        const configure = this.ref.get(Configure, { strict: false });
        const { connections = [] }: DBOptions = await configure.get<DBOptions>('database');
        for (const conn of connections) {
            let dataSource: DataSource | undefined;
            if (conn.autoMigrate) {
                try {
                    dataSource = new DataSource(conn as DataSourceOptions);
                    const runner = new TypeormMigrationRun();
                    if (dataSource && dataSource.isInitialized) {
                        await dataSource.destroy();
                    }
                    dataSource.setOptions({
                        subscribers: [],
                        synchronize: false,
                        migrationsRun: false,
                        logging: ['error'],
                        migrations: [
                            join(conn.paths.migration, '**/*.ts'),
                            join(conn.paths.migration, '**/*.js'),
                        ],
                        dropSchema: false,
                    });
                    await dataSource.initialize();
                    await runner.handler({ dataSource });
                } catch (error) {
                    await panic({ message: 'Run migrations failed!', error });
                } finally {
                    if (dataSource && dataSource.isInitialized) {
                        await dataSource.destroy();
                    }
                }
            }
        }
    }
}
