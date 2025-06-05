import { resolve } from 'path';

import { ensureFileSync, readFileSync, writeFileSync } from 'fs-extra';
import { has, isNil, omit, set } from 'lodash';
import { parse } from 'yaml';

export class ConfigStorage {
    protected _enabled = false;

    protected _path = resolve(__dirname, '../../..', 'config.yaml');

    protected _config: RecordAny = {};

    get enabled() {
        return this._enabled;
    }

    get path() {
        return this._path;
    }

    get config() {
        return this._config;
    }

    constructor(enabled?: boolean, filePath?: string) {
        if (!isNil(enabled)) {
            this._enabled = enabled;
        }
        if (this._enabled) {
            if (!isNil(filePath)) {
                this._path = filePath;
            }
            ensureFileSync(this._path);
            const config = parse(readFileSync(this._path, 'utf-8'));
            this._config = isNil(config) ? {} : config;
        }
    }

    set<T>(key: string, value: T) {
        ensureFileSync(this.path);
        set(this._config, key, value);
        writeFileSync(this.path, JSON.stringify(this._config, null, 4));
    }

    remove(key: string) {
        this._config = omit(this._config, [key]);
        if (has(this._config, key)) {
            omit(this._config, [key]);
        }
        writeFileSync(this.path, JSON.stringify(this._config, null, 4));
    }
}
