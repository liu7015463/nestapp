import { resolve } from 'path';

import { SeederRunner } from '@/modules/database/resolver/seeder.runner';

import { ConfigureFactory, ConfigureRegister } from '../config/types';
import { createConnectionOptions } from '../config/utils';
import { deepMerge } from '../core/helpers';

import { DBConfig, DBOptions, TypeormOption } from './types';

export const createDBConfig: (
    register: ConfigureRegister<RePartial<DBConfig>>,
) => ConfigureFactory<DBConfig, DBOptions> = (register) => ({
    register,
    hook: (configure, value) => createDBOptions(value),
    defaultRegister: () => ({
        common: {
            charset: 'utf8mb4',
            logging: ['error'],
            seeders: [],
            seedRunner: SeederRunner,
            factories: [],
        },
        connections: [],
    }),
});

export const createDBOptions = (options: DBConfig) => {
    const newOptions: DBOptions = {
        common: deepMerge(
            {
                charset: 'utf8mb4',
                logging: ['error'],
                autoMigrate: true,
                paths: { migration: resolve(__dirname, '../../database/migrations') },
            },
            options.common ?? {},
            'replace',
        ),
        connections: createConnectionOptions(options.connections ?? []),
    };
    newOptions.connections = newOptions.connections.map((connection) => {
        const entities = connection.entities ?? [];
        const newOption = { ...connection, entities };
        return deepMerge(
            newOptions.common,
            { ...newOption, autoLoadEntities: true, synchronize: false } as any,
            'replace',
        ) as TypeormOption;
    });
    return newOptions;
};
