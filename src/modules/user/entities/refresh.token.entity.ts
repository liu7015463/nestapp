import type { Relation } from 'typeorm';
import { Entity, JoinColumn, OneToOne } from 'typeorm';

import { AccessTokenEntity } from '@/modules/user/entities/access.token.entity';
import { BaseToken } from '@/modules/user/entities/base.token';

/**
 * 刷新Token的Token模型
 */
@Entity('user_refresh_token')
export class RefreshTokenEntity extends BaseToken {
    /**
     * 关联的登录令牌
     */
    @OneToOne(() => AccessTokenEntity, (token) => token.refreshToken, { onDelete: 'CASCADE' })
    @JoinColumn()
    accessToken: Relation<AccessTokenEntity>;
}
