import { Injectable } from '@nestjs/common';

import { isNil } from 'lodash';
import { MeiliSearch } from 'meilisearch';

import { MeiliConfig } from '@/modules/meilisearch/types';

@Injectable()
export class MeiliService {
    protected options: MeiliConfig;

    protected clients: Map<string, MeiliSearch> = new Map();

    constructor(options: MeiliConfig) {
        this.options = options;
    }

    getOptions() {
        return this.options;
    }

    async createClients() {
        for (const option of this.options) {
            this.clients.set(option.name, new MeiliSearch(option));
        }
    }

    getClient(name?: string): MeiliSearch {
        let key = 'default';
        if (!isNil(name)) {
            key = name;
        }
        if (!this.clients.has(key)) {
            throw new Error(`No client found for ${name}`);
        }
        return this.clients.get(key);
    }

    getClients(): Map<string, MeiliSearch> {
        return this.clients;
    }
}
