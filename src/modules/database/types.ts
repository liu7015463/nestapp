import { FindTreeOptions, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { OrderType, SelectTrashMode } from '@/modules/database/constants';

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
