import { ModuleMetadata, PipeTransform, Type } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { Configure } from '../config/configure';
import { ConfigStorageOption, ConfigureFactory } from '../config/types';

export type App = {
    container?: NestFastifyApplication;

    configure: Configure;
};

export interface CreateOptions {
    modules: (configure: Configure) => Promise<Required<ModuleMetadata['imports']>>;

    builder: ContainerBuilder;

    globals?: {
        pipe?: (configure: Configure) => PipeTransform<any> | null;

        intercepter?: Type<any> | null;

        filter?: Type<any> | null;
    };

    providers?: ModuleMetadata['providers'];

    config: {
        factories: Record<string, ConfigureFactory<RecordAny>>;

        storage: ConfigStorageOption;
    };
}

export interface ContainerBuilder {
    (params: { configure: Configure; BootModule: Type<any> }): Promise<NestFastifyApplication>;
}
