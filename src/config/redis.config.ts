import { RedisOptions } from '@/modules/core/types';

export const redis: () => RedisOptions = () => ({
    host: '127.0.0.1',
    port: 6379,
});
