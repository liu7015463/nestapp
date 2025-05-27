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

/**
 * 生成指定范围内的唯一随机整数数组
 * @param start 起始范围（包含）
 * @param end 结束范围（包含）
 * @param n 生成数量
 * @returns 包含 n 个唯一 [start, end] 区间内随机整数的数组
 * @throws 当请求数量超出范围时抛出错误
 */
export function generateUniqueRandomNumbers(start: number, end: number, n: number): number[] {
    // 处理反向范围并计算实际区间
    const [min, max] = start <= end ? [start, end] : [end, start];
    const range = max - min + 1;

    if (n <= 0 || !Number.isInteger(n)) {
        throw new Error('参数 n 必须是正整数');
    }

    if (n === 1) {
        return generateRandomNumber(start, end);
    }

    // 参数校验：请求数量不能超过可用唯一值总数
    if (n > range) {
        throw new Error(
            `Cannot generate ${n} unique numbers in range [${min}, ${max}]. Maximum possible: ${range}`,
        );
    }

    // 生成所有可能的候选数字
    const candidates = Array.from({ length: range }, (_, i) => min + i);

    // Fisher-Yates 洗牌算法随机打乱数组
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // 返回前 n 个元素
    return candidates.slice(0, n);
}

export function generateRandomNumber(start: number, end: number): number[] {
    // 处理反向范围（确保 min <= max）
    const [min, max] = start <= end ? [start, end] : [end, start];

    if (min === max) {
        return [min];
    }

    // 生成 1 个随机整数
    return Array.from({ length: 1 }, () => {
        // 随机数公式：Math.floor(Math.random() * (max - min + 1)) + min
        return Math.floor(Math.random() * (max - min + 1)) + min;
    });
}
