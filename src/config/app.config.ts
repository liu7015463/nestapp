import { toNumber } from 'lodash';

import { createAppConfig } from '@/modules/core/config';

export const app = createAppConfig((configure) => ({
    port: configure.env.get<number>('APP_PORT', (v) => toNumber(v), 3099),
    prefix: 'api',
}));
