import { createMeiliConfig } from '@/modules/meilisearch/config';

export const meili = createMeiliConfig((configure) => [
    {
        name: 'default',
        host: 'http://192.168.50.26:7700',
    },
]);
