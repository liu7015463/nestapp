import { Injectable } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';

import { isArray, isFunction, omit, pick } from 'lodash';
import { EntityNotFoundError, In, IsNull, Not, SelectQueryBuilder } from 'typeorm';

import { PostOrder } from '@/modules/content/constants';
import { CreatePostDto, QueryPostDto, UpdatePostDto } from '@/modules/content/dtos/post.dto';
import { PostEntity } from '@/modules/content/entities/post.entity';
import { CategoryRepository } from '@/modules/content/repositories';
import { PostRepository } from '@/modules/content/repositories/post.repository';
import { SearchService } from '@/modules/content/services/search.service';
import { SearchType } from '@/modules/content/types';
import { SelectTrashMode } from '@/modules/database/constants';
import { QueryHook } from '@/modules/database/types';
import { paginate } from '@/modules/database/utils';

import { TagRepository } from '../repositories/tag.repository';

import { CategoryService } from './category.service';

type FindParams = {
    [key in keyof Omit<QueryPostDto, 'limit' | 'page'>]: QueryPostDto[key];
};

@Injectable()
export class PostService {
    constructor(
        protected repository: PostRepository,
        protected categoryRepository: CategoryRepository,
        protected categoryService: CategoryService,
        protected tagRepository: TagRepository,
        protected searchService?: SearchService,
        protected searchType: SearchType = 'mysql',
    ) {}

    async paginate(options: QueryPostDto, callback?: QueryHook<PostEntity>) {
        if (!isNil(this.searchService) && !isNil(options.search) && this.searchType === 'meili') {
            return this.searchService.search(
                options.search,
                pick(options, ['trashed', 'page', 'limit']),
            );
        }
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
        const createPostDto = {
            ...omit(data, ['publish']),
            category: isNil(data.category)
                ? null
                : await this.categoryRepository.findOneOrFail({ where: { id: data.category } }),
            tags: isArray(data.tags) ? await this.tagRepository.findBy({ id: In(data.tags) }) : [],
            publishedAt,
        };
        const item = await this.repository.save(createPostDto);
        const result = await this.detail(item.id);
        if (!isNil(this.searchService)) {
            await this.searchService.create(result);
        }
        return result;
    }

    async update(data: UpdatePostDto) {
        let publishedAt: Date | null;
        if (!isNil(data.publish)) {
            publishedAt = data.publish ? new Date() : null;
        }
        const post = await this.detail(data.id);
        if (data.category !== undefined) {
            post.category = isNil(data.category)
                ? null
                : await this.categoryRepository.findOneByOrFail({ id: data.category });
            await this.repository.save(post, { reload: true });
        }
        if (isArray(data.tags)) {
            await this.repository
                .createQueryBuilder('post')
                .relation(PostEntity, 'tags')
                .of(post)
                .addAndRemove(data.tags, post.tags ?? []);
        }
        await this.repository.update(data.id, {
            ...omit(data, ['id', 'publish', 'tags', 'category']),
            publishedAt,
        });
        const result = await this.detail(data.id);
        if (!isNil(this.searchService)) {
            await this.searchService.update([result]);
        }
        return result;
    }

    async delete(ids: string[], trash?: boolean) {
        const items = await this.repository
            .buildBaseQB()
            .where('post.id IN (:...ids)', { ids })
            .withDeleted()
            .getMany();
        let result: PostEntity[];
        if (trash) {
            const directs = items.filter((item) => !isNil(item.deleteAt));
            const softs = items.filter((item) => isNil(item.deleteAt));
            result = [
                ...(await this.repository.remove(directs)),
                ...(await this.repository.softRemove(softs)),
            ];
            if (!isNil(this.searchService)) {
                await this.searchService.delete(directs.map((item) => item.id));
                await this.searchService.update(softs);
            }
        } else {
            result = await this.repository.remove(items);
            if (!isNil(this.searchService)) {
                await this.searchService.delete(ids);
            }
        }
        return result;
    }

    async restore(ids: string[]) {
        const items = await this.repository
            .buildBaseQB()
            .where('post.id IN (:...ids)', { ids })
            .withDeleted()
            .getMany();
        const trashes = items.filter((item) => !isNil(item.deleteAt));
        await this.searchService.update(trashes);
        const trashedIds = trashes.map((item) => item.id);
        if (trashedIds.length < 1) {
            return [];
        }
        await this.repository.restore(trashedIds);
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), {}, async (qbuilder) =>
            qbuilder.andWhereInIds(trashedIds),
        );
        return qb.getMany();
    }

    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: FindParams,
        callback?: QueryHook<PostEntity>,
    ) {
        const { orderBy, isPublished, category, tag, trashed } = options;
        if (typeof isPublished === 'boolean') {
            isPublished
                ? qb.where({ publishedAt: Not(IsNull()) })
                : qb.where({ publishedAt: IsNull() });
        }
        if (trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY) {
            qb.withDeleted();
            if (trashed === SelectTrashMode.ONLY) {
                qb.where('post.deletedAt is not null');
            }
        }
        this.queryOrderBy(qb, orderBy);
        if (category) {
            await this.queryByCategory(category, qb);
        }
        if (tag) {
            qb.where('tags.id = :id', { id: tag });
        }
        if (callback) {
            return callback(qb);
        }
        return qb;
    }

    protected buildSearchQuery(qb: SelectQueryBuilder<PostEntity>, search: string) {
        qb.orWhere('title LIKE :search', { search: `%${search}%` })
            .orWhere('summary LIKE :search', { search: `%${search}%` })
            .orWhere('body LIKE :search', { search: `%${search}%` })
            .orWhere('category.name LIKE :search', { search: `%${search}%` })
            .orWhere('tags.name LIKE :search', { search: `%${search}%` });
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
            case PostOrder.COMMENTCOUNT:
                return qb.orderBy('post.commentCount', 'DESC');
            default:
                return qb
                    .orderBy('post.createdAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC');
        }
    }

    protected async queryByCategory(id: string, qb: SelectQueryBuilder<PostEntity>) {
        const root = await this.categoryService.detail(id);
        const tree = await this.categoryRepository.findDescendantsTree(root);
        const flatDes = await this.categoryRepository.toFlatTrees(tree.children);
        const ids = [tree.id, ...flatDes.map((item) => item.id)];
        return qb.where('categoryRepository.id IN (:...ids)', { ids });
    }
}
