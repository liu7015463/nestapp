import { Exclude, Expose, Type } from 'class-transformer';
import {
    BaseEntity,
    Column,
    DeleteDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    Relation,
} from 'typeorm';

import { UserEntity } from '@/modules/user/entities';

import { PermissionEntity } from './permission.entity';

/**
 * 角色信息
 */
@Exclude()
@Entity('rbac_role')
export class RoleEntity extends BaseEntity {
    /**
     * 角色ID
     */
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * 角色名称
     */
    @Column({ comment: '角色名称' })
    name: string;

    /**
     * 显示名称
     */
    @Column({ comment: '显示名称', nullable: true })
    label?: string;

    /**
     * 角色描述
     */
    @Column({ comment: '角色描述', nullable: true, type: 'text' })
    description?: string;

    /**
     * 是否为不可更改的系统权限
     */
    @Column({ comment: '是否为不可更改的系统权限', default: false })
    systemed?: boolean;

    /**
     * 删除时间
     */
    @Expose({ groups: ['role-detail', 'role-list'] })
    @Type(() => Date)
    @DeleteDateColumn({ comment: '删除时间' })
    deletedAt: Date;

    /**
     * 角色权限
     */
    @Expose({ groups: ['role-detail'] })
    @Type(() => PermissionEntity)
    @ManyToMany(() => PermissionEntity, (permission) => permission.roles, {
        cascade: true,
        eager: true,
    })
    permissions: Relation<PermissionEntity>[];

    /**
     * 角色关联用户
     */
    @ManyToMany(() => UserEntity, (user) => user.roles, { deferrable: 'INITIALLY IMMEDIATE' })
    @JoinTable()
    users: Relation<UserEntity>[];
}
