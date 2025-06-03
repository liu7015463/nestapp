import { isNil, pick, unset } from 'lodash';
import {
    EntityManager,
    EntityTarget,
    FindOptionsUtils,
    FindTreeOptions,
    ObjectLiteral,
    QueryRunner,
    SelectQueryBuilder,
    TreeRepository,
    TreeRepositoryUtils,
} from 'typeorm';

import { OrderType, TreeChildrenResolve } from '../constants';
import { OrderQueryType, QueryParams } from '../types';
import { getOrderByQuery } from '../utils';

export abstract class BaseTreeRepository<T extends ObjectLiteral> extends TreeRepository<T> {
    protected abstract _qbName: string;

    protected _childrenResolve?: TreeChildrenResolve;

    protected orderBy?: string | { name: string; order: `${OrderType}` };

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(target: EntityTarget<T>, manager: EntityManager, queryRunner?: QueryRunner) {
        super(target, manager, queryRunner);
    }

    get qbName() {
        return this._qbName;
    }

    get childrenResolve() {
        return this._childrenResolve;
    }

    buildBaseQB(qb?: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
        const queryBuilder = qb ?? this.createQueryBuilder(this.qbName);
        return queryBuilder.leftJoinAndSelect(`${this.qbName}.parent`, 'parent');
    }

    addOrderByQuery(qb: SelectQueryBuilder<T>, orderBy?: OrderQueryType) {
        const orderByQuery = orderBy ?? this.orderBy;
        return isNil(orderByQuery) ? qb : getOrderByQuery(qb, this.qbName, orderByQuery);
    }

    async findTrees(options?: FindTreeOptions & QueryParams<T>) {
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    async findDescendantsTree(entity: T, options?: FindTreeOptions & QueryParams<T>) {
        const { addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        let qb = this.buildBaseQB(
            this.createDescendantsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if (withTrashed) {
            qb.withDeleted();
            if (onlyTrashed) {
                qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
            }
        }
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            this.qbName,
            entities.raw,
        );
        TreeRepositoryUtils.buildChildrenEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
            { depth: -1, ...pick(options, ['relations']) },
        );
        return entity;
    }

    async toFlatTrees(trees: T[], depth = 0, parent: T | null = null) {
        const data: Omit<T, 'children'>[] = [];
        for (const item of trees) {
            (item as any).depth = depth;
            (item as any).parent = parent;
            const { children } = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1, item)));
        }
        return data as T[];
    }
}
