import { ForbiddenException, Injectable } from '@nestjs/common';

import { isNil } from 'lodash';

import { EntityNotFoundError, In, SelectQueryBuilder } from 'typeorm';

import {
    CreateCommentDto,
    QueryCommentDto,
    QueryCommentTreeDto,
} from '@/modules/content/dtos/comment.dto';
import { CommentEntity } from '@/modules/content/entities/comment.entity';
import { CommentRepository, PostRepository } from '@/modules/content/repositories';
import { BaseService } from '@/modules/database/base/service';
import { treePaginate } from '@/modules/database/utils';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

@Injectable()
export class CommentService extends BaseService<CommentEntity, CommentRepository> {
    constructor(
        protected repository: CommentRepository,
        protected userRepository: UserRepository,
        protected postRepository: PostRepository,
    ) {
        super(repository);
    }

    async findTrees(options: QueryCommentTreeDto = {}) {
        return this.repository.findTrees({
            addQuery: async (qb) => {
                return isNil(options.post) ? qb : qb.where('post.id = :id', { id: options.post });
            },
        });
    }

    async paginate(options: QueryCommentDto) {
        const { post, ...query } = options;
        const addQuery = async (qb: SelectQueryBuilder<CommentEntity>) => {
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

    async create(data: CreateCommentDto, author: ClassToPlain<UserEntity>) {
        const parent = await this.getParent(undefined, data.parent);
        if (!isNil(parent) && parent.post.id !== data.post) {
            throw new ForbiddenException('Parent comment and child comment must belong same post!');
        }
        const item = await this.repository.save({
            ...data,
            parent,
            post: await this.getPost(data.post),
            author: await this.userRepository.findOneByOrFail({ id: author.id }),
        });
        return this.repository.findOneOrFail({
            where: { id: item.id },
            relations: ['parent', 'children', 'post'],
        });
    }

    async delete(ids: string[]) {
        const comments = await this.repository.find({ where: { id: In(ids) } });
        return this.repository.remove(comments);
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

    update(data: any, ...others: any[]): Promise<CommentEntity> {
        throw new Error('Method not implemented.');
    }
}
