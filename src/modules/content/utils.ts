import { instanceToPlain } from 'class-transformer';
import { isNil, pick } from 'lodash';

import { PostEntity } from '@/modules/content/entities';
import { CategoryRepository, CommentRepository } from '@/modules/content/repositories';

export async function getSearchItem(
    categoryRepository: CategoryRepository,
    commentRepository: CommentRepository,
    post: PostEntity,
) {
    const categories = isNil(post.category)
        ? []
        : (await categoryRepository.flatAncestorsTree(post.category)).map((item) => ({
              id: item.id,
              name: item.name,
          }));
    const comments = (
        await commentRepository.find({
            relations: ['post'],
            where: { post: { id: post.id } },
        })
    ).map((item) => ({ id: item.id, name: item.body }));
    return [
        {
            ...pick(instanceToPlain(post), [
                'id',
                'title',
                'body',
                'summary',
                'commentCount',
                'deletedAt',
                'publishedAt',
                'createdAt',
                'updatedAt',
            ]),
            categories,
            comments,
            tags: post.tags.map((item) => ({ id: item.id, name: item.name })),
        },
    ];
}

export const getSearchData = async (
    posts: PostEntity[],
    categoryRepository: CategoryRepository,
    commentRepository: CommentRepository,
) =>
    (
        await Promise.all(
            posts.map((post) => getSearchItem(categoryRepository, commentRepository, post)),
        )
    ).reduce((o, n) => [...o, ...n], []);
