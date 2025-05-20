import { Injectable } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';

import { isFunction, omit } from 'lodash';
import { EntityNotFoundError, IsNull, Not, SelectQueryBuilder } from 'typeorm';

import { PostOrder } from '@/modules/content/constants';
import { CreatePostDto, UpdatePostDto } from '@/modules/content/dtos/post.dto';
import { PostEntity } from '@/modules/content/entities/post.entity';
import { PostRepository } from '@/modules/content/repositories/post.repository';
import { PaginateOptions, QueryHook } from '@/modules/database/types';
import { paginate } from '@/modules/database/utils';

@Injectable()
export class PostService {
    constructor(protected repository: PostRepository) {}

    async paginate(options: PaginateOptions, callback?: QueryHook<PostEntity>) {
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), options, callback);
        return paginate(qb, options);
    }

    async detail(id: string, callback?: QueryHook<PostEntity>) {
        let qb = this.repository.buildBaseQB();
        qb.where(`post.id = :id`, { id });
        qb = !isNil(callback) && isFunction(callback) ? await callback(qb) : qb;
        const item = await qb.getOne();
        if (!item) {
            throw new EntityNotFoundError(PostEntity, `The post ${id} not exists!`);
        }
        return item;
    }

    async create(data: CreatePostDto) {
        let publishedAt: Date | null;
        if (!isNil(data.publish)) {
            publishedAt = data.publish ? new Date() : null;
        }
        const item = await this.repository.save({ ...omit(data, ['publish']), publishedAt });
        return this.detail(item.id);
    }

    async update(data: UpdatePostDto) {
        let publishedAt: Date | null;
        if (!isNil(data.publish)) {
            publishedAt = data.publish ? new Date() : null;
        }
        await this.repository.update(data.id, {
            ...omit(data, ['id', 'publish']),
            publishedAt,
        });
        return this.detail(data.id);
    }

    async delete(id: string) {
        const item = await this.repository.findOneByOrFail({ id });
        return this.repository.remove(item);
    }

    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: RecordAny,
        callback?: QueryHook<PostEntity>,
    ) {
        const { orderBy, isPublished } = options;
        if (typeof isPublished === 'boolean') {
            isPublished
                ? qb.where({ publishedAt: Not(IsNull()) })
                : qb.where({ publishedAt: IsNull() });
        }
        this.queryOrderBy(qb, orderBy);
        if (callback) {
            return callback(qb);
        }
        return qb;
    }

    protected queryOrderBy(qb: SelectQueryBuilder<PostEntity>, orderBy?: PostOrder) {
        switch (orderBy) {
            case PostOrder.CREATED:
                return qb.orderBy('post.createdAt', 'DESC');
            case PostOrder.UPDATED:
                return qb.orderBy('post.updatedAt', 'DESC');
            case PostOrder.PUBLISHED:
                return qb.orderBy('post.publishedAt', 'DESC');
            case PostOrder.CUSTOM:
                return qb.orderBy('post.customOrder', 'DESC');
            default:
                return qb
                    .orderBy('post.createdAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC');
        }
    }
}
