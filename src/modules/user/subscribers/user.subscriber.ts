import { randomBytes } from 'node:crypto';

import { EventSubscriber, InsertEvent, LoadEvent, UpdateEvent } from 'typeorm';

import { BaseSubscriber } from '@/modules/database/base/subscriber';
import { RoleEntity } from '@/modules/rbac/entities';
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

    async afterLoad(user: UserEntity, event: LoadEvent<any>): Promise<void> {
        let permissions = user.permissions ?? [];
        for (const role of user.roles ?? []) {
            const roleEntity = await this.getManage(event).findOneOrFail(RoleEntity, {
                relations: ['permissions'],
                where: { id: role.id },
            });
            permissions = [...permissions, ...(roleEntity.permissions ?? [])];
        }
        user.permissions = permissions.reduce((o, n) => {
            if (o.find(({ name }) => name === n.name)) {
                return o;
            }
            return [...o, n];
        }, []);
    }
}
