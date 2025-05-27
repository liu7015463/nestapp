import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { getDataSourceToken, TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { DataSource, ObjectType } from 'typeorm';

import { CUSTOM_REPOSITORY_METADATA } from '@/modules/database/constants';

import { DataExistConstraint } from '../core/constraints/data.exist.constraint';

@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        return {
            global: true,
            module: DatabaseModule,
            imports: [TypeOrmModule.forRoot(configRegister())],
            providers: [DataExistConstraint],
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
