import { isNil } from 'lodash';

import { BaseSubscriber } from '@/modules/database/base/subscriber';

import { RoleEntity } from '../entities/role.entity';

export class RoleSubscriber extends BaseSubscriber<RoleEntity> {
    protected entity = RoleEntity;

    async afterLoad(entity: RoleEntity): Promise<void> {
        if (isNil(entity.label)) {
            entity.label = entity.name;
        }
    }
}
