import { isArray, isNil } from 'lodash';
import { DataSource, ObjectLiteral, ObjectType, Repository, SelectQueryBuilder } from 'typeorm';

import { OrderQueryType, PaginateOptions, PaginateReturn } from '@/modules/database/types';

import { CUSTOM_REPOSITORY_METADATA } from './constants';

export const paginate = async <T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    options: PaginateOptions,
): Promise<PaginateReturn<T>> => {
    const limit = isNil(options.limit) || options.limit < 1 ? 1 : options.limit;
    const page = isNil(options.page) || options.page < 1 ? 1 : options.page;
    const start = page >= 1 ? page - 1 : 0;
    const totalItems = await qb.getCount();
    qb.take(limit).skip(start * limit);
    const items = await qb.getMany();
    const totalPages =
        totalItems % limit === 0
            ? Math.floor(totalItems / limit)
            : Math.floor(totalItems / limit) + 1;
    const remainder = totalItems % limit === 0 ? limit : totalItems % limit;
    const itemCount = page < totalPages ? limit : remainder;
    return {
        items,
        meta: {
            totalItems,
            itemCount,
            perPage: limit,
            totalPages,
            currentPage: page,
        },
    };
};

export function treePaginate<T extends ObjectLiteral>(
    options: PaginateOptions,
    data: T[],
): PaginateReturn<T> {
    const { page, limit } = options;
    let items: T[] = [];
    const totalItems = data.length;
    const totalRst = totalItems / limit;
    const totalPages =
        totalRst > Math.floor(totalRst) ? Math.floor(totalRst) + 1 : Math.floor(totalRst);
    let itemCount = 0;
    if (page <= totalPages) {
        itemCount = page === totalPages ? totalItems - (totalPages - 1) * limit : limit;
        const start = (page - 1) * limit;
        items = data.slice(start, start + itemCount);
    }
    return {
        meta: {
            itemCount,
            totalItems,
            perPage: limit,
            totalPages,
            currentPage: page,
        },
        items,
    };
}

export const getOrderByQuery = <T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    orderBy?: OrderQueryType,
) => {
    if (isNil(orderBy)) {
        return qb;
    }
    if (typeof orderBy === 'string') {
        return qb.orderBy(`${alias}.${orderBy}`, 'DESC');
    }
    if (isArray(orderBy)) {
        for (const item of orderBy) {
            typeof item === 'string'
                ? qb.addOrderBy(`${alias}.${item}`, 'DESC')
                : qb.addOrderBy(`${alias}.${item.name}`, item.order);
        }
        return qb;
    }
    return qb.orderBy(`${alias}.${(orderBy as any).name}`, (orderBy as any).order);
};

export const getCustomRepository = <P extends Repository<T>, T extends ObjectLiteral>(
    dataSource: DataSource,
    Repo: ClassType<P>,
): P => {
    if (isNil(Repo)) {
        return null;
    }
    const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repo);
    if (!entity) {
        return null;
    }
    const base = dataSource.getRepository<ObjectType<any>>(entity);
    return new Repo(base.target, base.manager, base.queryRunner) as P;
};
