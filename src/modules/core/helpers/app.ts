import { BadGatewayException, Global, Module, ModuleMetadata, Type } from '@nestjs/common';

import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { useContainer } from 'class-validator';

import { omit } from 'lodash';

import { ConfigModule } from '@/modules/config/config.module';
import { Configure } from '@/modules/config/configure';

import { DEFAULT_VALIDATION_CONFIG } from '@/modules/content/constants';

import { CoreModule } from '../core.module';
import { AppFilter } from '../providers/app.filter';
import { AppInterceptor } from '../providers/app.interceptor';
import { AppPipe } from '../providers/app.pipe';
import { App, AppConfig, CreateOptions } from '../types';

import { CreateModule } from './utils';

export const app: App = { configure: new Configure(), commands: [] };

export const createApp = (options: CreateOptions) => async (): Promise<App> => {
    const { config, builder } = options;

    await app.configure.initialize(config.factories, config.storage);

    if (!app.configure.has('app')) {
        throw new BadGatewayException('App config not exists');
    }

    const BootModule = await createBootModule(app.configure, options);

    app.container = await builder({ configure: app.configure, BootModule });

    useContainer(app.container.select(BootModule), { fallbackOnErrors: true });
    return app;
};

export async function createBootModule(
    configure: Configure,
    options: Pick<CreateOptions, 'globals' | 'providers' | 'modules'>,
): Promise<Type<any>> {
    const { globals = {}, providers = [] } = options;
    const modules = await options.modules(configure);
    const imports: ModuleMetadata['imports'] = (
        await Promise.all([
            ...modules,
            ConfigModule.forRoot(configure),
            await CoreModule.forRoot(configure),
        ])
    ).map((item) => {
        if ('module' in item) {
            const meta = omit(item, ['module', 'global']);
            Module(meta)(item.module);
            if (item.global) {
                Global()(item.module);
            }
            return item.module;
        }
        return item;
    });

    if (globals.pipe !== null) {
        const pipe = globals.pipe
            ? globals.pipe(configure)
            : new AppPipe(DEFAULT_VALIDATION_CONFIG);
        providers.push({ provide: APP_PIPE, useValue: pipe });
    }

    if (globals.interceptor !== null) {
        providers.push({
            provide: APP_INTERCEPTOR,
            useClass: globals.interceptor ?? AppInterceptor,
        });
    }

    if (globals.filter !== null) {
        providers.push({
            provide: APP_FILTER,
            useClass: AppFilter,
        });
    }

    return CreateModule('BootModule', () => ({
        imports,
        providers,
    }));
}

export async function startApp(
    creater: () => Promise<App>,
    listened: (app: App, startTime: Date) => () => Promise<void>,
) {
    const startTime = new Date();
    const { container, configure } = await creater();
    app.container = container;
    app.configure = configure;
    const { port, host } = await configure.get<AppConfig>('app');
    await container.listen(port, host, listened(app, startTime));
}
