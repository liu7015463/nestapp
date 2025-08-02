import { RedisOptions } from '@/modules/message/types';

export const redis: () => RedisOptions = () => ({
    host: '192.168.50.137',
    port: 6379,
    password: '123456&Qw',
});
