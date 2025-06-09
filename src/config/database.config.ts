import { toNumber } from 'lodash';

import { createDBConfig } from '@/modules/database/config';

export const database = createDBConfig((configure) => ({
    common: { synchronize: true },
    connections: [
        {
            type: 'mysql',
            host: configure.env.get('DB_HOST', '192.168.50.26'),
            port: configure.env.get<number>('DB_PORT', (v) => toNumber(v), 3306),
            username: configure.env.get('DB_USERNAME', '3r'),
            password: configure.env.get('DB_PASSWORD', '12345678'),
            database: configure.env.get('DB_NAME', '3r'),
        },
    ],
}));
