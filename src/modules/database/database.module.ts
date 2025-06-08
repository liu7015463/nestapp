import { DynamicModule, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { getDataSourceToken, TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { DataSource, ObjectType } from 'typeorm';

import { CUSTOM_REPOSITORY_METADATA } from '@/modules/database/constants';

import { Configure } from '../config/configure';

import { panic } from '../core/helpers';

import {
    DataExistConstraint,
    TreeUniqueConstraint,
    TreeUniqueExistContraint,
    UniqueConstraint,
    UniqueExistConstraint,
} from './constraints';
import { DBOptions } from './types';

@Module({})
export class DatabaseModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        if (!configure.has('database')) {
            panic({ message: 'Database config not exists' });
        }
        const { connections } = await configure.get<DBOptions>('database');
        const imports: ModuleMetadata['imports'] = [];
        for (const connection of connections) {
            imports.push(TypeOrmModule.forRoot(connection as TypeOrmModuleOptions));
        }
        const providers: ModuleMetadata['providers'] = [
            DataExistConstraint,
            UniqueConstraint,
            UniqueExistConstraint,
            TreeUniqueConstraint,
            TreeUniqueExistContraint,
        ];
        return {
            global: true,
            module: DatabaseModule,
            imports,
            providers,
        };
    }
    static forRepository<T extends Type<any>>(
        repositories: T[],
        datasourceName?: string,
    ): DynamicModule {
        const providers: Provider[] = [];
        for (const Repository of repositories) {
            const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repository);
            if (!entity) {
                continue;
            }
            providers.push({
                inject: [getDataSourceToken(datasourceName)],
                provide: Repository,
                useFactory: (datasource: DataSource): InstanceType<typeof Repository> => {
                    const base = datasource.getRepository<ObjectType<any>>(entity);
                    return new Repository(base.target, base.manager, base.queryRunner);
                },
            });
        }
        return {
            exports: providers,
            module: DatabaseModule,
            providers,
        };
    }
}
