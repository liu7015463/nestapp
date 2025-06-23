import { randomBytes } from 'node:crypto';

import { EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';

import { BaseSubscriber } from '@/modules/database/base/subscriber';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { encrypt } from '@/modules/user/utils';

@EventSubscriber()
export class UserSubscriber extends BaseSubscriber<UserEntity> {
    protected entity = UserEntity;

    /**
     * 生成随机用户名
     * @param event
     * @protected
     */
    protected async generateUserName(event: InsertEvent<UserEntity>): Promise<string> {
        const username = `user_${randomBytes(4).toString('hex').slice(0, 8)}`;
        const user = await event.manager.findOne(UserEntity, { where: { username } });
        return user ? this.generateUserName(event) : username;
    }

    async beforeInsert(event: InsertEvent<UserEntity>): Promise<void> {
        if (!event.entity.username) {
            event.entity.username = await this.generateUserName(event);
        }
        if (!event.entity.password) {
            event.entity.password = randomBytes(11).toString('hex').slice(0, 22);
        }
        event.entity.password = await encrypt(this.configure, event.entity.password);
    }

    async beforeUpdate(event: UpdateEvent<UserEntity>) {
        if (this.isUpdated('password', event)) {
            event.entity.password = await encrypt(this.configure, event.entity.password);
        }
    }
}
