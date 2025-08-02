import { isArray, isNil, omit } from 'lodash';

import type { BullOptions, QueueOptions, RedisOption, RedisOptions } from './types';

/**
 * 生成Redis配置
 * @param options
 */
export const createRedisOptions = (options: RedisOptions): RedisOption[] | undefined => {
    if (isNil(options)) {
        return undefined;
    }
    const config: Array<RedisOption> = Array.isArray(options)
        ? options
        : [{ ...options, name: 'default' }];
    if (config.length < 1) {
        return undefined;
    }
    if (isNil(config.find(({ name }) => name === 'default'))) {
        config[0].name = 'default';
    }

    return config.reduce<RedisOption[]>((o, n) => {
        const names = o.map(({ name }) => name) as string[];
        return names.includes(n.name) ? o : [...o, n];
    }, []);
};

/**
 * 生成BullMQ模块的配置
 * @param options
 * @param redis
 */
export const createQueueOptions = (
    options: QueueOptions,
    redis: Array<RedisOption>,
): BullOptions | undefined => {
    if (isNil(options) || isNil(redis)) {
        return undefined;
    }
    const names = redis.map(({ name }) => name);
    if (names.length < 1 || !names.includes('default')) {
        return undefined;
    }
    if (isArray(options)) {
        return options.map((option) => ({
            ...omit(option, 'redis'),
            connection: redis.find(({ name: c }) => c === (option.redis ?? 'default')),
        }));
    }
    return {
        ...omit(options, 'redis'),
        connection: redis.find(({ name: c }) => c === (options.redis ?? 'default')),
    };
};
