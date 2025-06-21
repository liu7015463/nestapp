import { isNil } from 'lodash';
import { Ora } from 'ora';

import { DataSource, EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers';
import {
    Seeder,
    SeederConstructor,
    SeederLoadParams,
    SeederOptions,
} from '@/modules/database/commands/types';
import { DBOptions } from '@/modules/database/types';

/**
 * 数据填充基类
 */
export abstract class BaseSeeder implements Seeder {
    protected connection: string;
    protected dataSource: DataSource;
    protected em: EntityManager;
    protected configure: Configure;
    protected ignoreLock: boolean;
    protected truncates: EntityTarget<ObjectLiteral>[] = [];

    constructor(
        protected readonly spinner: Ora,
        protected readonly args: SeederOptions,
    ) {}

    /**
     * 清空原数据并重新加载数据
     * @param params
     */
    async load(params: SeederLoadParams): Promise<any> {
        const { connection, dataSource, em, configure, ignoreLock } = params;
        this.connection = connection;
        this.dataSource = dataSource;
        this.em = em;
        this.configure = configure;
        this.ignoreLock = ignoreLock;

        if (this.ignoreLock) {
            for (const option of this.truncates) {
                await this.em.clear(option);
            }
        }

        return this.run(this.dataSource);
    }

    /**
     * 运行seeder的关键方法
     * @param dataSource
     * @param em
     * @protected
     */
    protected abstract run(dataSource: DataSource, em?: EntityManager): Promise<any>;

    protected async getDBConfig() {
        const { connections = [] }: DBOptions = await this.configure.get<DBOptions>('database');
        const dbConfig = connections.find(({ name }) => name === this.connection);
        if (isNil(dbConfig)) {
            await panic(`Database connection named ${this.connection} not exists!`);
        }
        return dbConfig;
    }

    /**
     * 运行子seeder
     * @param SubSeeder
     * @protected
     */
    protected async call(SubSeeder: SeederConstructor) {
        const subSeeder: Seeder = new SubSeeder(this.spinner, this.args);
        await subSeeder.load({
            connection: this.connection,
            dataSource: this.dataSource,
            em: this.em,
            configure: this.configure,
            ignoreLock: this.ignoreLock,
        });
    }
}
