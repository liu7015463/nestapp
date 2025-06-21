import { Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { isArray, isNil } from 'lodash';
import { Ora } from 'ora';
import {
    DataSource,
    DataSourceOptions,
    EntityManager,
    EntityTarget,
    ObjectLiteral,
    ObjectType,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';

import { Configure } from '@/modules/config/configure';
import {
    DBFactoryBuilder,
    FactoryOptions,
    Seeder,
    SeederConstructor,
    SeederOptions,
} from '@/modules/database/commands/types';
import { DataFactory } from '@/modules/database/resolver/data.factory';
import {
    DBOptions,
    DefineFactory,
    OrderQueryType,
    PaginateOptions,
    PaginateReturn,
    TypeormOption,
} from '@/modules/database/types';

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

export const addEntities = async (
    configure: Configure,
    entities: EntityClassOrSchema[] = [],
    dataSource = 'default',
) => {
    const database = await configure.get<DBOptions>('database');
    if (isNil(database)) {
        throw new Error('Database not exists');
    }
    const dbConfig = database.connections.find(({ name }) => name === dataSource);
    if (isNil(dbConfig)) {
        throw new Error(`Database connection ${dataSource} not exists`);
    }

    const oldEntities = (dbConfig.entities ?? []) as ObjectLiteral[];
    const newEntities = database.connections.map((conn) =>
        conn.name === dataSource ? { ...conn, entities: [...oldEntities, ...entities] } : conn,
    );
    configure.set('database.connections', newEntities);
    return TypeOrmModule.forFeature(entities, dataSource);
};

export async function addSubscribers(
    configure: Configure,
    subscribers: Type<any>[] = [],
    dataSource = 'default',
) {
    const database = await configure.get<DBOptions>('database');
    if (isNil(database)) {
        throw new Error('Database not exists');
    }
    const dbConfig = database.connections.find(({ name }) => name === dataSource);
    if (isNil(dbConfig)) {
        throw new Error(`Database connection ${dataSource} not exists`);
    }
    const oldSubscribers = (dbConfig.subscribers ?? []) as any[];
    const newSubscribers = database.connections.map((conn) =>
        conn.name === dataSource
            ? { ...conn, subscribers: [...oldSubscribers, subscribers] }
            : conn,
    );
    configure.set('database.connections', newSubscribers);
    return subscribers;
}

/**
 * 忽略外键
 * @param em EntityManager实例
 * @param type 数据库类型
 * @param disabled 是否禁用外键
 */
export async function resetForeignKey(
    em: EntityManager,
    type = 'mysql',
    disabled = true,
): Promise<EntityManager> {
    let key: string;
    let query: string;
    if (type === 'sqlite') {
        key = disabled ? 'OFF' : 'ON';
        query = `PRAGMA foreign_keys = ${key}`;
    } else {
        key = disabled ? '0' : '1';
        query = `SET FOREIGN_KEY_CHECKS = ${key}`;
    }
    await em.query(query);
    return em;
}

/**
 * 数据填充函数
 * @param Clazz 填充类
 * @param args 填充命令参数
 * @param spinner Ora雪碧图标
 * @param configure 配置对象
 * @param dbConfig 当前数据库连接池的配置
 */
export async function runSeeder(
    Clazz: SeederConstructor,
    args: SeederOptions,
    spinner: Ora,
    configure: Configure,
    dbConfig: TypeormOption,
): Promise<DataSource> {
    const seeder: Seeder = new Clazz(spinner, args);
    const dataSource: DataSource = new DataSource({ ...dbConfig } as DataSourceOptions);

    await dataSource.initialize();

    const factoryMaps: FactoryOptions = {};
    for (const factory of dbConfig.factories) {
        const { entity, handler } = factory();
        factoryMaps[entity.name] = { entity, handler };
    }

    if (typeof args.transaction === 'boolean' && !args.transaction) {
        const em = await resetForeignKey(dataSource.manager, dataSource.options.type);
        await seeder.load({
            dataSource,
            em,
            configure,
            connection: args.connection ?? 'default',
            ignoreLock: args.ignorelock,
            factory: factoryBuilder(configure, dataSource, factoryMaps),
            factories: factoryMaps,
        });
        await resetForeignKey(em, dataSource.options.type, false);
    } else {
        // 在事务中运行
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const em = await resetForeignKey(dataSource.manager, dataSource.options.type);
            await seeder.load({
                dataSource,
                em,
                configure,
                connection: args.connection ?? 'default',
                ignoreLock: args.ignorelock,
                factory: factoryBuilder(configure, dataSource, factoryMaps),
                factories: factoryMaps,
            });
            await resetForeignKey(em, dataSource.options.type, false);
            await queryRunner.commitTransaction();
        } catch (e) {
            console.error(e);
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    }

    if (dataSource && dataSource.isInitialized) {
        await dataSource.destroy();
    }
    return dataSource;
}

/**
 * 定义factory用于生成数据
 * @param entity
 * @param handler
 */
export const defineFactory: DefineFactory = (entity, handler) => () => ({ entity, handler });

/**
 * 获取Entity类名
 * @param entity
 */
export function entityName<T>(entity: EntityTarget<T>): string {
    if (isNil(entity)) {
        throw new Error('Entity is not defined');
    }
    if (entity instanceof Function) {
        return entity.name;
    }
    return new (entity as any)().constructor.name;
}

export const factoryBuilder: DBFactoryBuilder =
    (configure, dataSource, factories) => (entity) => (settings) => {
        const name = entityName(entity);
        if (!factories[name]) {
            throw new Error(`has none factory for entity named ${name}`);
        }
        return new DataFactory(
            name,
            configure,
            entity,
            dataSource.createEntityManager(),
            factories[name].handler,
            settings,
        );
    };
