import { MeiliConfig } from '@/modules/meilisearch/types';

export const MEILI_CONFIG = (): MeiliConfig => [
    {
        name: 'default',
        host: 'http://localhost:7700',
        apiKey: 'masterKey',
    },
];
