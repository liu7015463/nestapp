import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
    FindTreeOptions,
    ObjectLiteral,
    ObjectType,
    Repository,
    SelectQueryBuilder,
    TreeRepository,
} from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { SeederConstructor } from '@/modules/database/commands/types';
import { OrderType, SelectTrashMode } from '@/modules/database/constants';

import { BaseRepository } from './base/repository';
import { BaseTreeRepository } from './base/tree.repository';

export type QueryHook<Entity> = (
    qb: SelectQueryBuilder<Entity>,
) => Promise<SelectQueryBuilder<Entity>>;

export interface PaginateMeta {
    itemCount: number;
    totalItems?: number;
    perPage: number;
    totalPages?: number;
    currentPage: number;
}

export interface PaginateOptions {
    page?: number;
    limit?: number;
}

export interface PaginateReturn<E extends ObjectLiteral> {
    meta: PaginateMeta;
    items: E[];
}

export type OrderQueryType =
    | string
    | { name: string; order: `${OrderType}` }
    | Array<string | { name: string; order: `${OrderType}` }>;

export interface QueryParams<T extends ObjectLiteral> {
    addQuery?: QueryHook<T>;

    orderBy?: OrderQueryType;

    withTrashed?: boolean;

    onlyTrashed?: boolean;
}

export type ServiceListQueryOptionWithTrashed<T extends ObjectLiteral> = Omit<
    FindTreeOptions & QueryParams<T>,
    'withTrashed'
> & { trashed?: `${SelectTrashMode}` } & RecordAny;

export type ServiceListQueryOptionNotWithTrashed<T extends ObjectLiteral> = Omit<
    ServiceListQueryOptionWithTrashed<T>,
    'trashed'
>;

export type ServiceListQueryOption<T extends ObjectLiteral> =
    | ServiceListQueryOptionNotWithTrashed<T>
    | ServiceListQueryOptionWithTrashed<T>;

export type RepositoryType<T extends ObjectLiteral> =
    | Repository<T>
    | TreeRepository<T>
    | BaseRepository<T>
    | BaseTreeRepository<T>;

export type DBConfig = {
    common: RecordAny & DBAdditionalOption;
    connections: Array<TypeOrmModuleOptions & { name?: string }>;
};

export type TypeormOption = Omit<TypeOrmModuleOptions, 'name' | 'migrations'> & {
    name: string;
} & DBAdditionalOption;

export type DBOptions = RecordAny & {
    common: RecordAny;
    connections: TypeormOption[];
};

type DBAdditionalOption = {
    paths?: {
        migration?: string;
    };

    /**
     * 是否在启动应用后自动运行迁移
     */
    autoMigrate?: boolean;

    /**
     * 数据填充类列表
     */
    seeders?: SeederConstructor[];
    /**
     * 数据填充入口类
     */
    seedRunner?: SeederConstructor;
    /**
     * 定义数据工厂列表
     */
    factories?: (() => DBFactoryOption<any, any>)[];
};

export type DBFactoryHandler<P, T> = (configure: Configure, options: T) => Promise<P>;

export type DBFactoryOption<P, T> = {
    entity: ObjectType<P>;
    handler: DBFactoryHandler<P, T>;
};

export type DefineFactory = <P, T>(
    entity: ObjectType<P>,
    handler: DBFactoryHandler<P, T>,
) => () => DBFactoryOption<P, T>;

export type FactoryOverride<Entity> = {
    [Property in keyof Entity]?: Entity[Property];
};
