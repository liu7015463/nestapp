import { isPromise } from 'node:util/types';

import { isNil } from 'lodash';
import { EntityManager, EntityTarget } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers';
import { DBFactoryHandler, FactoryOverride } from '@/modules/database/types';

export class DataFactory<P, T> {
    private mapFunction!: (entity: P) => Promise<P>;

    constructor(
        public name: string,
        public configure: Configure,
        public entity: EntityTarget<P>,
        protected em: EntityManager,
        protected factory: DBFactoryHandler<P, T>,
        protected settings: T,
    ) {}

    map(mapFunction: (entity: P) => Promise<P>): DataFactory<P, T> {
        this.mapFunction = mapFunction;
        return this;
    }

    async make(params: FactoryOverride<P> = {}): Promise<P> {
        if (this.factory) {
            let entity: P = await this.resolveEntity(
                await this.factory(this.configure, this.settings),
            );
            if (this.mapFunction) {
                entity = await this.mapFunction(entity);
            }
            for (const key in params) {
                if (params[key]) {
                    entity[key] = params[key];
                }
            }
            return entity;
        }
        throw new Error('Could not found entity');
    }

    async create(params: FactoryOverride<P> = {}, existsCheck?: string): Promise<P> {
        try {
            const entity = await this.make(params);
            if (!isNil(existsCheck)) {
                const repo = this.em.getRepository(this.entity);
                const value = (entity as any)[existsCheck];
                if (!isNil(value)) {
                    const item = await repo.findOneBy({ [existsCheck]: value } as any);
                    if (isNil(item)) {
                        return await this.em.save(entity);
                    }
                    return item;
                }
            }
            return await this.em.save(entity);
        } catch (error) {
            const message = 'Could not save entity';
            await panic({ message, error });
            throw new Error(message);
        }
    }

    async makeMany(amount: number, params: FactoryOverride<P> = {}): Promise<P[]> {
        const list = [];
        for (let i = 0; i < amount; i++) {
            list[i] = await this.make(params);
        }
        return list;
    }

    async createMany(
        amount: number,
        params: FactoryOverride<P> = {},
        existsCheck?: string,
    ): Promise<P[]> {
        const list = [];
        for (let i = 0; i < amount; i++) {
            list[i] = await this.create(params, existsCheck);
        }
        return list;
    }

    private async resolveEntity(entity: P): Promise<P> {
        for (const attr in entity) {
            if (entity[attr]) {
                if (isPromise(entity[attr])) {
                    entity[attr] = await entity[attr];
                } else if (typeof entity[attr] === 'object' && !(entity[attr] instanceof Date)) {
                    const item = entity[attr];
                    try {
                        if (typeof (item as any).make === 'function') {
                            entity[attr] = await (item as any).make();
                        }
                    } catch (error) {
                        const message = `Could not make ${(item as any).name}`;
                        await panic({ message, error });
                        throw new Error(message);
                    }
                }
            }
        }
        return entity;
    }
}
