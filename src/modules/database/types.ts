import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { OrderType } from '@/modules/database/constants';

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
