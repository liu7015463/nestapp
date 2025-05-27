import { ForbiddenException, Injectable } from '@nestjs/common';

import { isNil } from 'lodash';

import { EntityNotFoundError, SelectQueryBuilder } from 'typeorm';

import {
    CreateCommentDto,
    QueryCommentDto,
    QueryCommentTreeDto,
} from '@/modules/content/dtos/comment.dto';
import { CommentEntity } from '@/modules/content/entities/comment.entity';
import { CommentRepository, PostRepository } from '@/modules/content/repositories';
import { treePaginate } from '@/modules/database/utils';

@Injectable()
export class CommentService {
    constructor(
        protected repository: CommentRepository,
        protected postRepository: PostRepository,
    ) {}

    async findTrees(options: QueryCommentTreeDto = {}) {
        return this.repository.findTrees({
            addQuery: (qb) => {
                return isNil(options.post) ? qb : qb.where('post.id = :id', { id: options.post });
            },
        });
    }

    async paginate(options: QueryCommentDto) {
        const { post, ...query } = options;
        const addQuery = (qb: SelectQueryBuilder<CommentEntity>) => {
            const condition: RecordString = {};
            if (!isNil(post)) {
                condition.post = post;
            }
            return Object.keys(condition).length > 0 ? qb.andWhere(condition) : qb;
        };
        const data = await this.repository.findRoots({ addQuery });
        let comments: CommentEntity[] = [];
        for (let i = 0; i < data.length; i++) {
            const comment = data[i];
            comments.push(await this.repository.findDescendantsTree(comment, { addQuery }));
        }
        comments = await this.repository.toFlatTrees(comments);
        return treePaginate(query, comments);
    }

    async create(data: CreateCommentDto) {
        const parent = await this.getParent(undefined, data.parent);
        if (!isNil(parent) && parent.post.id !== data.post) {
            throw new ForbiddenException('Parent comment and child comment must belong same post!');
        }
        const item = await this.repository.save({
            ...data,
            parent,
            post: await this.getPost(data.post),
        });
        return this.repository.findOneOrFail({ where: { id: item.id } });
    }

    async delete(id: string) {
        const comment = await this.repository.findOneOrFail({ where: { id: id ?? null } });
        return this.repository.remove(comment);
    }

    protected async getPost(id: string) {
        return isNil(id) ? null : this.postRepository.findOneOrFail({ where: { id } });
    }

    protected async getParent(current?: string, id?: string) {
        if (current === id) {
            return undefined;
        }
        let parent: CommentEntity | undefined;
        if (id !== undefined) {
            if (id === null) {
                return null;
            }
            parent = await this.repository.findOne({
                where: { id },
                relations: ['parent', 'children', 'post'],
            });
            if (!parent) {
                throw new EntityNotFoundError(CommentEntity, `Parent Comment ${id} not found`);
            }
        }
        return parent;
    }
}
