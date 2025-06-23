import type { Relation } from 'typeorm';
import { Entity, ManyToOne, OneToOne } from 'typeorm';

import { BaseToken } from '@/modules/user/entities/base.token';
import { RefreshTokenEntity } from '@/modules/user/entities/refresh.token.entity';
import { UserEntity } from '@/modules/user/entities/user.entity';

/**
 * 用户认证token模型
 */
@Entity('user_access_token')
export class AccessTokenEntity extends BaseToken {
    /**
     * 关联的刷新令牌
     */
    @OneToOne(() => RefreshTokenEntity, (token) => token.accessToken, { cascade: true })
    refreshToken: RefreshTokenEntity;

    /**
     * 关联用户
     */
    @ManyToOne(() => UserEntity, (user) => user.accessTokens, { onDelete: 'CASCADE' })
    user: Relation<UserEntity>;
}
