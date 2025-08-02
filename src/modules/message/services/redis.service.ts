import { Injectable } from '@nestjs/common';

import Redis from 'ioredis';

import { isNil } from 'lodash';

import type { RedisOption } from '@/modules/message/types';

@Injectable()
export class RedisService {
    protected options: RedisOption[];

    protected clients: Record<string, Redis> = {};

    constructor(protected _options: RedisOption[]) {
        this.options = _options;
    }

    async createClients() {
        this.options.map(async (option) => {
            this.clients[option.name] = new Redis(option);
        });
    }

    getClient(name?: string): Redis {
        const key = isNil(name) ? 'default' : name;
        if (this.clients[key]) {
            return this.clients[key];
        }
        throw new Error(`Unknown client ${key}`);
    }

    getClients() {
        return this.clients;
    }
}
