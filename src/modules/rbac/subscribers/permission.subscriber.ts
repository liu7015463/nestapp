import { isNil } from 'lodash';

import { BaseSubscriber } from '@/modules/database/base/subscriber';

import { PermissionEntity } from '../entities/permission.entity';

export class PermissionSubscriber extends BaseSubscriber<PermissionEntity> {
    protected entity = PermissionEntity;

    async afterLoad(entity: PermissionEntity): Promise<void> {
        if (isNil(entity.label)) {
            entity.label = entity.name;
        }
    }
}
