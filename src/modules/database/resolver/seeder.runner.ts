import { resolve } from 'path';

import { Type } from '@nestjs/common';
import { ensureFileSync, readFileSync, writeFileSync } from 'fs-extra';
import { get, isNil, set } from 'lodash';
import { DataSource, EntityManager } from 'typeorm';
import YAML from 'yaml';

import { BaseSeeder } from '@/modules/database/base/BaseSeeder';
import { DBFactory } from '@/modules/database/commands/types';

/**
 * 默认的Seed Runner
 */
export class SeederRunner extends BaseSeeder {
    protected async run(
        factory: DBFactory,
        dataSource: DataSource,
        em: EntityManager,
    ): Promise<any> {
        let seeders: Type<any>[] = ((await this.getDBConfig()) as any).seeders ?? [];
        const seedLockFile = resolve(__dirname, '../../../..', 'seed-lock.yml');
        ensureFileSync(seedLockFile);
        const lockFileYml = YAML.parse(readFileSync(seedLockFile, 'utf8'));
        const locked = isNil(lockFileYml) ? {} : lockFileYml;
        const lockNames = get<string[]>(locked, this.connection, []);
        if (!this.ignoreLock) {
            seeders = seeders.filter((s) => !lockNames.includes(s.name));
        }
        for (const seeder of seeders) {
            await this.call(seeder);
        }
        set(
            locked,
            this.connection,
            this.ignoreLock
                ? seeders.map((s) => s.name)
                : [...lockNames, ...seeders.map((s) => s.name)],
        );
        writeFileSync(seedLockFile, JSON.stringify(locked, null, 4));
    }
}
