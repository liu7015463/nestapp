import { Exclude, Expose, Type } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

/**
 * 用户实体
 */
@Exclude()
@Entity('user')
export class UserEntity {
    /**
     *用户ID
     */
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    /**
     *用户昵称
     */
    @Expose()
    @Column({ comment: '昵称', nullable: true, length: 64 })
    nickname?: string;

    /**
     * 用户名
     */
    @Expose()
    @Column({ comment: '用户名', unique: true, length: 64 })
    username: string;

    /**
     * 用户密码
     */
    @Column({ comment: '用户密码', length: 500, select: false })
    password: string;

    /**
     * 用户手机号
     */
    @Expose()
    @Column({ comment: '用户手机号', length: 64, nullable: false, unique: true })
    phone?: string;

    /**
     * 用户邮箱
     */
    @Expose()
    @Column({ comment: '用户邮箱', length: 256, nullable: true, unique: true })
    email?: string;

    /**
     * 用户创建时间
     */
    @Expose()
    @Type(() => Date)
    @CreateDateColumn({ comment: '用户创建时间' })
    createdAt?: Date;

    /**
     * 用户更新时间
     */
    @Expose()
    @Type(() => Date)
    @UpdateDateColumn({ comment: '用户更新时间' })
    updatedAt?: Date;

    /**
     * 用户销户时间
     */
    @Expose()
    @Type(() => Date)
    @DeleteDateColumn({ comment: '用户销户时间' })
    deletedAt?: Date;
}
