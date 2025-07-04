import { QueueOptions } from '@/modules/core/types';

export const queue: () => QueueOptions = () => ({
    redis: 'default',
});
