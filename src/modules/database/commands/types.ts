import { Arguments } from 'yargs';

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
export type MigrationGenerateArguments = TypeOrmArguments & MigrationCreateOptions;

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
