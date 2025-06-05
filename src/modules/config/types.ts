import { Configure } from './configure';

export interface ConfigStorageOption {
    enable?: boolean;
    filePath?: string;
}

export type ConfigureRegister<T extends RecordAny> = (configure: Configure) => T | Promise<T>;

export interface ConfigureFactory<T extends RecordAny, P extends RecordAny = T> {
    register: ConfigureRegister<RePartial<T>>;

    defaultRegister?: ConfigureRegister<T>;

    storage?: boolean;

    hook?: (configure: Configure, value: T) => P | Promise<P>;

    append?: boolean;
}

export type ConnectionOption<T extends RecordAny> = { name?: string } & T;

export type ConnectionRst<T extends RecordAny> = Array<{ name?: string } & T>;
