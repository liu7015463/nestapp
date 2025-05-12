import { Injectable, NotFoundException } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';

import { CreatePostDto } from '@/modules/content/dtos/create-post.dto';
import { UpdatePostDto } from '@/modules/content/dtos/update-post.dto';
import { PostEntity } from '@/modules/content/types';

@Injectable()
export class PostService {
    protected posts: PostEntity[] = [
        { title: '第一篇文章标题', body: '第一篇文章内容' },
        { title: '第二篇文章标题', body: '第二篇文章内容' },
        { title: '第三篇文章标题', body: '第三篇文章内容' },
        { title: '第四篇文章标题', body: '第四篇文章内容' },
        { title: '第五篇文章标题', body: '第五篇文章内容' },
        { title: '第六篇文章标题', body: '第六篇文章内容' },
    ].map((v, id) => ({ ...v, id }));

    async findAll() {
        return this.posts;
    }

    async findOne(id: number) {
        const post = this.posts.find((item) => item.id === id);
        if (isNil(post)) {
            throw new NotFoundException(`the post with id ${id} not exits!`);
        }
        return post;
    }

    async create(data: CreatePostDto) {
        const newPost: PostEntity = {
            id: Math.max(...this.posts.map(({ id }) => id + 1)),
            ...data,
        };
        this.posts.push(newPost);
        return newPost;
    }

    async update(data: UpdatePostDto) {
        let toUpdate = this.posts.find((item) => item.id === data.id);
        if (isNil(toUpdate)) {
            throw new NotFoundException(`the post with id ${data.id} not exits!`);
        }
        toUpdate = { ...toUpdate, ...data };
        this.posts = this.posts.filter((item) => (item.id === data.id ? toUpdate : item));
        return toUpdate;
    }

    async delete(id: number) {
        const toDelete = this.posts.find((item) => item.id === id);
        if (isNil(toDelete)) {
            throw new NotFoundException(`the post with id ${id} not exits!`);
        }
        this.posts = this.posts.filter((item) => item.id !== id);
        return toDelete;
    }
}
