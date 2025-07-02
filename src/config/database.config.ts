import { toNumber } from 'lodash';

import { createDBConfig } from '@/modules/database/config';
import { ContentFactory } from '@/modules/database/factories/content.factory';
import ContentSeeder from '@/modules/database/seeders/content.seeder';

export const database = createDBConfig((configure) => ({
    common: {
        synchronize: true,
        // 启用详细日志以便调试 SQL 错误
        logging: configure.env.get('NODE_ENV') === 'development' ? ['error', 'query'] : ['error'],
        // 启用最大日志记录
        maxQueryExecutionTime: 1000,
    },
    connections: [
        {
            type: 'mysql',
            host: configure.env.get('DB_HOST', '192.168.50.26'),
            port: configure.env.get<number>('DB_PORT', (v) => toNumber(v), 3306),
            username: configure.env.get('DB_USERNAME', '3r'),
            password: configure.env.get('DB_PASSWORD', '12345678'),
            database: configure.env.get('DB_NAME', '3r'),
            seeders: [ContentSeeder],
            factories: [ContentFactory],
        },
    ],
}));
