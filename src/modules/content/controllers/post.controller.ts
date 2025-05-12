import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    ValidationPipe,
} from '@nestjs/common';

import { isNil } from '@nestjs/common/utils/shared.utils';

import { CreatePostDto } from '@/modules/content/dtos/create-post.dto';
import { UpdatePostDto } from '@/modules/content/dtos/update-post.dto';

import { PostEntity } from '../types';

let posts: PostEntity[] = [
    { title: '第一篇文章标题', body: '第一篇文章内容' },
    { title: '第二篇文章标题', body: '第二篇文章内容' },
    { title: '第三篇文章标题', body: '第三篇文章内容' },
    { title: '第四篇文章标题', body: '第四篇文章内容' },
    { title: '第五篇文章标题', body: '第五篇文章内容' },
    { title: '第六篇文章标题', body: '第六篇文章内容' },
].map((v, id) => ({ ...v, id }));

@Controller('posts')
export class PostController {
    @Get()
    async index() {
        return posts;
    }

    @Get(':id')
    async show(@Param('id') id: number) {
        const post = posts.find((item) => item.id === Number(id));
        if (isNil(post)) {
            throw new NotFoundException(`the post with id ${id} not exits!`);
        }
        return post;
    }

    @Post()
    async store(
        @Body(
            new ValidationPipe({
                transform: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreatePostDto,
    ) {
        const newPost: PostEntity = {
            id: Math.max(...posts.map(({ id }) => id + 1)),
            ...data,
        };
        posts.push(newPost);
        return newPost;
    }

    @Patch()
    async update(
        @Body(
            new ValidationPipe({
                transform: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['update'],
            }),
        )
        { id, ...data }: UpdatePostDto,
    ) {
        let toUpdate = posts.find((item) => item.id === Number(id));
        if (isNil(toUpdate)) {
            throw new NotFoundException(`the post with id ${id} not exits!`);
        }

        toUpdate = { ...toUpdate, ...data };
        posts = posts.map((item) => (item.id === Number(id) ? toUpdate : item));
        return toUpdate;
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        const toDelete = posts.find((item) => item.id === Number(id));
        if (isNil(toDelete)) {
            throw new NotFoundException(`the post with id ${id} not exits!`);
        }
        posts = posts.filter((item) => item.id !== Number(id));
        return toDelete;
    }
}
