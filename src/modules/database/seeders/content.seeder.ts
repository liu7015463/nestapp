import * as fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line import/no-extraneous-dependencies
import * as fakerjs from '@faker-js/faker';
import { existsSync } from 'fs-extra';
import { DataSource, EntityManager, In } from 'typeorm';

import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import { CategoryRepository, TagRepository } from '@/modules/content/repositories';
import { getRandomItemData, getRandomListData, panic } from '@/modules/core/helpers';
import { BaseSeeder } from '@/modules/database/base/BaseSeeder';

import {
    categories,
    CategoryData,
    PostData,
    posts,
    TagData,
    tags,
} from '@/modules/database/factories/content.data';

import { IPostFactoryOptions } from '@/modules/database/factories/content.factory';

import { getCustomRepository, getFakerLocales } from '@/modules/database/utils';

import { DBFactory } from '../commands/types';

export default class ContentSeeder extends BaseSeeder {
    protected truncates = [PostEntity, CategoryEntity, TagEntity, CommentEntity];
    protected factory: DBFactory;

    async run(factory?: DBFactory, dataSource?: DataSource, em?: EntityManager): Promise<any> {
        this.factory = factory;
        await this.loadCategory(categories);
        await this.loadTag(tags);
        await this.loadPosts(posts);
    }

    private async getRandomComment(post: PostEntity, count: number, parent?: CommentEntity) {
        const comments: CommentEntity[] = [];
        const faker = new fakerjs.Faker({ locale: await getFakerLocales(this.configure) });
        for (let i = 0; i < count; i++) {
            const comment = new CommentEntity();
            comment.body = faker.lorem.paragraph(Math.floor(Math.random() * 18) + 6);
            comment.post = post;
            if (parent) {
                comment.parent = parent;
            }
            comments.push(await this.em.save(comment));
            if (Math.random() >= 0.7) {
                comment.children = await this.getRandomComment(
                    post,
                    Math.floor(Math.random() * 5),
                    comment,
                );
                await this.em.save(comment);
            }
        }
        return comments;
    }

    private async loadCategory(data: CategoryData[], parent?: CategoryEntity) {
        let order = 0;
        for (const item of data) {
            const category = new CategoryEntity();
            category.name = item.name;
            category.customOrder = order;
            if (parent) {
                category.parent = parent;
            }
            await this.em.save(category);
            order += 1;
            if (item.children) {
                await this.loadCategory(item.children, category);
            }
        }
    }

    private async loadTag(data: TagData[]) {
        for (const item of data) {
            const tag = new TagEntity();
            tag.name = item.name;
            await this.em.save(tag);
        }
    }

    private async loadPosts(data: PostData[]) {
        const allCategories: CategoryEntity[] = await this.em.find(CategoryEntity);
        const allTags = await this.em.find(TagEntity);
        for (const item of data) {
            const filePath = path.join(__dirname, '../../../assets/posts', item.contentFile);
            if (!existsSync(filePath)) {
                await panic({
                    spinner: this.spinner,
                    message: `post content file ${filePath} not exits!`,
                });
            }

            const options: IPostFactoryOptions = {
                title: item.title,
                body: fs.readFileSync(filePath, 'utf8'),
                isPublished: true,
            };
            if (item.summary) {
                options.summary = item.summary;
            }
            if (item.category) {
                options.category = await getCustomRepository(
                    this.dataSource,
                    CategoryRepository,
                ).findOneBy({ id: item.category });
            }
            if (item.tags) {
                options.tags = await getCustomRepository(this.dataSource, TagRepository).find({
                    where: { name: In(item.tags) },
                });
            }
            const post = await this.factory(PostEntity)(options).create();
            await this.getRandomComment(post, Math.floor(Math.random() * 8));
        }

        await this.factory(PostEntity)<IPostFactoryOptions>({
            tags: getRandomListData(allTags),
            category: getRandomItemData(allCategories),
        }).createMany(10);
    }
}
