import { fakerEN } from '@faker-js/faker/.';

import { CreateCommentDto } from '@/modules/content/dtos/comment.dto';
import { CreatePostDto } from '@/modules/content/dtos/post.dto';
import { CreateTagDto } from '@/modules/content/dtos/tag.dto';

export function generateMockPost(): CreatePostDto {
    return {
        title: fakerEN.lorem.words(5).slice(0, 255),
        body: fakerEN.lorem.paragraphs(3),
        summary: fakerEN.lorem.sentence().slice(0, 500),
        publish: fakerEN.datatype.boolean(),
        keywords: Array(3)
            .fill(null)
            .map(() => fakerEN.lorem.word().slice(0, 20)),
        customOrder: fakerEN.number.int({ min: 0, max: 10000 }),
        category: fakerEN.string.uuid(),
        tags: Array(2)
            .fill(null)
            .map(() => fakerEN.string.uuid()),
    };
}

export function generateMockTag(): CreateTagDto {
    return {
        name: fakerEN.lorem.word().slice(0, 20),
        desc: fakerEN.lorem.words(5).slice(0, 255),
    };
}

export function generateMockComment(): CreateCommentDto {
    return {
        body: fakerEN.lorem.paragraphs(2),
        post: fakerEN.string.uuid(),
        parent: fakerEN.string.uuid(),
    };
}
