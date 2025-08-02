import { QueueOptions } from '@/modules/message/types';

export const queue: () => QueueOptions = () => ({
    redis: 'default',
});
