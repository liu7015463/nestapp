import { isNil } from 'lodash';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

import { OrderType } from '@/modules/database/constants';
import { OrderQueryType } from '@/modules/database/types';
import { getOrderByQuery } from '@/modules/database/utils';

export abstract class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
    protected abstract _qbName: string;

    protected orderBy?: string | { name: string; order: `${OrderType}` };

    get qbName() {
        return this._qbName;
    }

    buildBaseQB() {
        return this.createQueryBuilder(this.qbName);
    }

    addOrderByQuery(qb: SelectQueryBuilder<T>, orderBy?: OrderQueryType) {
        const orderByQuery = orderBy ?? this.orderBy;
        return isNil(orderByQuery) ? qb : getOrderByQuery(qb, this.qbName, orderByQuery);
    }
}
