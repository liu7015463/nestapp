import { NotFoundException } from '@nestjs/common';
import { isNil } from 'lodash';
import { In, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base/repository';
import { BaseTreeRepository } from '@/modules/database/base/tree.repository';
import { SelectTrashMode, TreeChildrenResolve } from '@/modules/database/constants';
import {
    PaginateOptions,
    PaginateReturn,
    QueryHook,
    ServiceListQueryOption,
} from '@/modules/database/types';
import { paginate, treePaginate } from '@/modules/database/utils';

export abstract class BaseService<
    T extends ObjectLiteral,
    R extends BaseRepository<T> | BaseTreeRepository<T>,
    P extends ServiceListQueryOption<T> = ServiceListQueryOption<T>,
> {
    protected repository: R;

    protected enableTrash = false;

    protected constructor(repository: R) {
        this.repository = repository;
        if (
            !(
                this.repository instanceof BaseRepository ||
                this.repository instanceof BaseTreeRepository
            )
        ) {
            throw new Error('Repository init error.');
        }
    }

    protected async buildItemQB(id: string, qb: SelectQueryBuilder<T>, callback?: QueryHook<T>) {
        qb.where(`${this.repository.qbName}.id = :id`, { id });
        if (callback) {
            return callback(qb);
        }
        return qb;
    }

    protected async buildListQB(qb: SelectQueryBuilder<T>, options?: P, callback?: QueryHook<T>) {
        const { trashed } = options ?? {};
        const queryName = this.repository.qbName;
        if (this.enableTrash && trashed in [SelectTrashMode.ALL, SelectTrashMode.ONLY]) {
            qb.withDeleted();
            if (trashed === SelectTrashMode.ONLY) {
                qb.where(`${queryName}.deletedAt IS NOT NULL`);
            }
        }
        if (callback) {
            return callback(qb);
        }
        return qb;
    }

    async list(options?: P, callback?: QueryHook<T>) {
        const { trashed: isTrashed = false } = options ?? {};
        const trashed = isTrashed || SelectTrashMode.NONE;
        if (this.repository instanceof BaseTreeRepository) {
            const withTrashed =
                this.enableTrash && trashed in [SelectTrashMode.ALL, SelectTrashMode.ONLY];
            const onlyTrashed = this.enableTrash && trashed === SelectTrashMode.ONLY;
            const tree = await this.repository.findTrees({ ...options, withTrashed, onlyTrashed });
            return this.repository.toFlatTrees(tree);
        }
        const qb = await this.buildListQB(this.repository.buildBaseQB(), options, callback);
        return qb.getMany();
    }

    async paginate(options?: PaginateOptions & P, callback?: QueryHook<T>) {
        const queryOptions = (options ?? {}) as P;
        if (this.repository instanceof BaseTreeRepository) {
            const data = await this.list(queryOptions, callback);
            return treePaginate(options, data) as PaginateReturn<T>;
        }
        const qb = await this.buildListQB(this.repository.buildBaseQB(), queryOptions, callback);
        return paginate(qb, options);
    }

    async detail(id: string, callback?: QueryHook<T>) {
        const qb = await this.buildItemQB(id, this.repository.buildBaseQB(), callback);
        const item = qb.getOne();
        if (!item) {
            throw new NotFoundException(`${this.repository.qbName} ${id} NOT FOUND`);
        }
        return item;
    }

    async delete(ids: string[], trash?: boolean) {
        let items: T[];
        if (this.repository instanceof BaseTreeRepository) {
            items = await this.repository.find({
                where: { id: In(ids) as any },
                withDeleted: this.enableTrash ? true : undefined,
                relations: ['parent', 'children'],
            });
            if (this.repository.childrenResolve === TreeChildrenResolve.UP) {
                for (const item of items) {
                    if (isNil(item.children) || item.children.length <= 0) {
                        continue;
                    }
                    const children = [...item.children].map((o) => {
                        o.parent = item.parent;
                        return item;
                    });
                    await this.repository.save(children);
                }
            }
        } else {
            items = await this.repository.find({
                where: { id: In(ids) as any },
                withDeleted: this.enableTrash ? true : undefined,
            });
        }

        if (this.enableTrash && trash) {
            const directs = items.filter((item) => !isNil(item.deletedAt));
            const softs = items.filter((item) => isNil(item.deletedAt));
            return [
                ...(await this.repository.remove(directs)),
                ...(await this.repository.softRemove(softs)),
            ];
        }
        return this.repository.remove(items);
    }
}
