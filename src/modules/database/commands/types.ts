import { Ora } from 'ora';
import { DataSource, EntityManager } from 'typeorm';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';

/**
 * 基础数据库命令参数类型
 */
export type TypeOrmArguments = Arguments<{ connection?: string }>;

/**
 * 创建迁移命令参数
 */
export type MigrationCreateArguments = TypeOrmArguments & MigrationCreateOptions;

/**
 * 创建迁移处理器选项
 */
export interface MigrationCreateOptions {
    name?: string;
}

/**
 * 生成迁移命令参数
 */
export type MigrationGenerateArguments = TypeOrmArguments & MigrationGenerateOptions;

/**
 * 生成迁移处理器选项
 */
export interface MigrationGenerateOptions {
    name?: string;
    run?: boolean;
    pretty?: boolean;
    dryrun?: boolean;
    check?: boolean;
}

/**
 * 运行迁移的命令参数
 */
export type MigrationRunArguments = TypeOrmArguments & MigrationRunOptions;

/**
 * 运行迁移处理器选项
 */
export interface MigrationRunOptions extends MigrationRevertOptions {
    refresh?: boolean;

    onlydrop?: boolean;
}

/**
 * 恢复迁移处理器选项
 */
export interface MigrationRevertOptions {
    transaction?: string;

    fake?: boolean;
}

/**
 * 恢复迁移的命令参数
 */
export type MigrationRevertArguments = TypeOrmArguments & MigrationRevertOptions;

/**
 * 数据填充处理器选项
 */
export interface SeederOptions {
    /**
     * 数据库连接名称
     */
    connection?: string;
    /**
     * 是否通过事务来运行填充
     */
    transaction?: boolean;
    /**
     * 是否忽略已经被执行过的填充类
     */
    ignorelock?: boolean;
}

/**
 * 数据填充类接口
 */
export interface SeederConstructor {
    new (spinner: Ora, args: SeederOptions): Seeder;
}

/**
 * 数据填充类方法对象
 */
export interface Seeder {
    load: (params: SeederLoadParams) => Promise<void>;
}

/**
 * 数据填充类的load函数参数
 */
export interface SeederLoadParams {
    /**
     * 数据库连接名称
     */
    connection: string;
    /**
     * 数据库连接
     */
    dataSource: DataSource;
    /**
     * EntityManager实例
     */
    em: EntityManager;
    /**
     * 项目配置类
     */
    configure: Configure;
    /**
     * 是否忽略锁定
     */
    ignoreLock: boolean;
}

/**
 * 数据填充命令参数
 */
export type SeederArguments = TypeOrmArguments & SeederOptions;
