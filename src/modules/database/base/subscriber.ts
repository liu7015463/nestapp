import { Optional } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { isNil } from 'lodash';
import {
    DataSource,
    EntitySubscriberInterface,
    EntityTarget,
    EventSubscriber,
    InsertEvent,
    ObjectLiteral,
    ObjectType,
    RecoverEvent,
    RemoveEvent,
    SoftRemoveEvent,
    TransactionCommitEvent,
    TransactionRollbackEvent,
    TransactionStartEvent,
    UpdateEvent,
} from 'typeorm';

import { Configure } from '@/modules/config/configure';

import { app } from '@/modules/core/helpers/app';

import { RepositoryType } from '../types';
import { getCustomRepository } from '../utils';

type SubscriberEvent<T extends ObjectLiteral> =
    | InsertEvent<T>
    | UpdateEvent<T>
    | SoftRemoveEvent<T>
    | RemoveEvent<T>
    | RecoverEvent<T>
    | TransactionStartEvent
    | TransactionCommitEvent
    | TransactionRollbackEvent;

@EventSubscriber()
export abstract class BaseSubscriber<T extends ObjectLiteral>
    implements EntitySubscriberInterface<T>
{
    protected abstract entity: ObjectType<T>;

    constructor(
        @Optional() protected dataSource?: DataSource,
        @Optional() protected _configure?: Configure,
    ) {
        if (!isNil(this.dataSource)) {
            this.dataSource.subscribers.push(this);
        }
    }

    get configure() {
        return isNil(this._configure)
            ? this.container.get(Configure, { strict: false })
            : this._configure;
    }

    get container(): NestFastifyApplication {
        return app.container;
    }

    protected getDataSource(event: SubscriberEvent<T>) {
        return this.dataSource ?? event.connection;
    }

    protected getManage(event: SubscriberEvent<T>) {
        return this.dataSource ? this.dataSource.manager : event.manager;
    }

    listenTo() {
        return this.entity;
    }

    async afterLoad(entity: any) {
        if ('parent' in entity && isNil(entity.depth)) {
            entity.depth = 0;
        }
    }

    protected getRepository<
        C extends ClassType<P>,
        P extends RepositoryType<T>,
        R extends EntityTarget<ObjectLiteral>,
    >(event: SubscriberEvent<T>, repository?: C, entity?: R) {
        return isNil(repository)
            ? this.getDataSource(event).getRepository(entity ?? this.entity)
            : getCustomRepository<P, T>(this.getDataSource(event), repository);
    }

    protected isUpdated(column: keyof T, event: UpdateEvent<T>) {
        return !!event.updatedColumns.find((o) => o.propertyName === column);
    }
}
