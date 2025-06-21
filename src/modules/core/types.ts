import { ModuleMetadata, PipeTransform, Type } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import dayjs from 'dayjs';
import { Ora } from 'ora';
import { StartOptions } from 'pm2';
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
