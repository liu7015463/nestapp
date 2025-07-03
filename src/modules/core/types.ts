/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */
import { ModuleMetadata, PipeTransform, Type } from '@nestjs/common';
import { IAuthGuard } from '@nestjs/passport';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { QueueOptions as BullMQOptions } from 'bullmq';
import dayjs from 'dayjs';
import Email from 'email-templates';
import { RedisOptions as IORedisOptions } from 'ioredis';
import { Attachment } from 'nodemailer/lib/mailer';
import { Ora } from 'ora';
import { StartOptions } from 'pm2';
import { ManyToMany, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { CommandModule } from 'yargs';

import { Configure } from '../config/configure';
import { ConfigStorageOption, ConfigureFactory } from '../config/types';

export type App = {
    container?: NestFastifyApplication;

    configure: Configure;

    commands: CommandModule<RecordAny, RecordAny>[];
};

export interface CreateOptions {
    modules: (configure: Configure) => Promise<Required<ModuleMetadata['imports']>>;

    builder: ContainerBuilder;

    globals?: {
        pipe?: (configure: Configure) => PipeTransform<any> | null;

        interceptor?: Type<any> | null;

        filter?: Type<any> | null;

        /**
         * 全局守卫
         */
        guard?: Type<IAuthGuard>;
    };

    providers?: ModuleMetadata['providers'];

    config: {
        factories: Record<string, ConfigureFactory<RecordAny>>;

        storage: ConfigStorageOption;
    };

    commands: () => CommandCollection;
}

export interface ContainerBuilder {
    (params: { configure: Configure; BootModule: Type<any> }): Promise<NestFastifyApplication>;
}

export interface AppConfig {
    name: string;

    host: string;

    port: number;

    https: boolean;

    /**
     * 语言,默认zh-cn
     */
    locale: string;

    /**
     * 备用语言
     */
    fallbackLocale: string;

    /**
     * 时区,默认Asia/Shanghai
     */
    timezone: string;

    url?: string;

    prefix?: string;

    pm2?: Omit<StartOptions, 'name' | 'cwd' | 'script' | 'args' | 'interpreter' | 'watch'>;
}

/**
 * 时间参数选项类型
 */
export interface TimeOptions {
    /**
     * 时间属性，如果不传入则获取当前属性
     */
    date?: dayjs.ConfigType;
    /**
     * 输出时间格式
     */
    format?: dayjs.OptionType;
    /**
     * 语言，如果不传入则使用app配置中设置的默认语言
     */
    locale?: string;
    /**
     * 是否开启严格模式
     */
    strict?: boolean;
    /**
     * 时区。如果不传入则使用app配置中设置的默认时区
     */
    zonetime?: string;
}

export interface PanicOption {
    message: string;

    error?: any;

    exit?: boolean;

    spinner?: Ora;
}

export interface CommandOption<T = RecordAny, P = RecordAny> extends CommandModule<T, P> {
    instant?: boolean;
}

export type CommandItem<T = RecordAny, P = RecordAny> = (
    app: Required<App>,
) => Promise<CommandOption<T, P>>;

export type CommandCollection = Array<CommandItem<any, any>>;

export interface CreateOption {
    commands: () => CommandCollection;
}

export interface DynamicRelation {
    relation:
        | ReturnType<typeof OneToOne>
        | ReturnType<typeof OneToMany>
        | ReturnType<typeof ManyToOne>
        | ReturnType<typeof ManyToMany>;
    column: string;
}

/**
 * 嵌套对象
 */
export type NestedRecord = Record<string, Record<string, any>>;

/**
 * core模块参数选项
 */
export interface CoreOptions {
    database?: () => TypeOrmModuleOptions;
    sms?: () => SmsOptions;
}
/**
 * 腾讯云短信驱动配置
 */
export type SmsOptions<T extends NestedRecord = RecordNever> = {
    secretId: string;
    secretKey: string;
    sign: string;
    appid: string;
    region: string;
    endpoint?: string;
} & T;

/**
 * 发送接口参数
 */
export interface SmsSendParams {
    appid?: string;
    numbers: string[];
    template: string;
    sign?: string;
    endpoint?: string;
    vars?: Record<string, any>;
    ExtendCode?: string;
    SessionContext?: string;
    SenderId?: string;
}

/**
 * SMTP邮件发送配置
 */
export type SmtpOptions<T extends NestedRecord = RecordNever> = {
    host: string;
    user: string;
    password: string;
    // Email模板总路径
    resource: string;
    from?: string;
    port?: number;
    secure?: boolean;
} & T;

/**
 * 公共发送接口配置
 */
export interface SmtpSendParams {
    // 模板名称
    name?: string;
    // 发信地址
    from?: string;
    // 主题
    subject?: string;
    // 目标地址
    to: string | string[];
    // 回信地址
    reply?: string;
    // 是否加载html模板
    html?: boolean;
    // 是否加载text模板
    text?: boolean;
    // 模板变量
    vars?: Record<string, any>;
    // 是否预览
    preview?: boolean | Email.PreviewEmailOpts;
    // 主题前缀
    subjectPrefix?: string;
    // 附件
    attachments?: Attachment[];
}

/**
 * Redis连接配置
 */
export type RedisOption = Omit<IORedisOptions, 'name'> & { name: string };

/**
 * Redis配置
 */
export type RedisOptions = IORedisOptions | Array<RedisOption>;

/**
 * 队列项配置
 */
export type QueueOption = Omit<BullMQOptions, 'connection'> & { redis?: string };

/**
 * 队列配置
 */
export type QueueOptions = QueueOption | Array<{ name: string } & QueueOption>;

/**
 * BullMQ模块注册配置
 */
export type BullOptions = BullMQOptions | Array<{ name: string } & BullMQOptions>;
