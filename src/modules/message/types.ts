import { QueueOptions as BullMQOptions } from 'bullmq';
import Email from 'email-templates';
import { RedisOptions as IORedisOptions } from 'ioredis';
import { Attachment } from 'nodemailer/lib/mailer';

/**
 * 嵌套对象
 */
export type NestedRecord = Record<string, RecordAny>;
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
