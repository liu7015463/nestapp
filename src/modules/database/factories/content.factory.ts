// eslint-disable-next-line import/no-extraneous-dependencies
import * as fakerjs from '@faker-js/faker';

import { Configure } from '@/modules/config/configure';
import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import { getTime } from '@/modules/core/helpers/time';
import { defineFactory, getFakerLocales } from '@/modules/database/utils';

export type IPostFactoryOptions = Partial<{
    title: string;
    summary: string;
    body: string;
    isPublished: boolean;
    category: CategoryEntity;
    tags: TagEntity[];
    comments: CommentEntity[];
}>;

export const ContentFactory = defineFactory(
    PostEntity,
    async (configure: Configure, options: IPostFactoryOptions) => {
        const faker = new fakerjs.Faker({ locale: await getFakerLocales(configure) });
        const post = new PostEntity();
        const { title, summary, body, category, tags } = options;
        post.title = title ?? faker.lorem.sentence(Math.floor(Math.random() * 10) + 6);
        if (summary) {
            post.summary = summary;
        }
        post.body = body ?? faker.lorem.paragraph(Math.floor(Math.random() * 500) + 1);
        if (Math.random() > 0.5) {
            post.publishedAt = (await getTime(configure)).toDate();
        }
        if (Math.random() > 0.5) {
            post.deletedAt = (await getTime(configure)).toDate();
        }
        if (category) {
            post.category = category;
        }
        if (tags) {
            post.tags = tags;
        }
        return post;
    },
);
