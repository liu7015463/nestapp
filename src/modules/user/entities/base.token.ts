import { Exclude } from 'class-transformer';
import { BaseEntity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

/**
 * Token模型
 */
@Exclude()
export abstract class BaseToken extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Column({ length: 500, comment: '令牌字符串' })
    value: string;

    @Column({
        comment: '令牌过期时间',
    })
    expiredAt: Date;

    @CreateDateColumn({
        comment: '令牌创建时间',
    })
    createdAt: Date;
}
