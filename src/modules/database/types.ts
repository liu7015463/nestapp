import {
    FindTreeOptions,
    ObjectLiteral,
    SelectQueryBuilder,
    Repository,
    TreeRepository,
} from 'typeorm';

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
