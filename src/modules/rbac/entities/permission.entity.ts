import { AbilityTuple, MongoQuery, RawRuleFrom } from '@casl/ability';
import { Exclude, Expose } from 'class-transformer';
import type { Relation } from 'typeorm';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { UserEntity } from '@/modules/user/entities';

import { RoleEntity } from './role.entity';

/**
 * 权限实体
 */
@Exclude()
@Entity('rbac_permission')
export class PermissionEntity<
    P extends AbilityTuple = AbilityTuple,
    T extends MongoQuery = MongoQuery,
> {
    /**
     * 权限ID
     */
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * 权限名称
     */
    @Expose()
    @Column({ comment: '权限名称' })
    name: string;

    /**
     * 权限显示名
     */
    @Expose()
    @Column({ comment: '权限显示名', nullable: true })
    label?: string;

    /**
     * 权限描述
     */
    @Expose()
    @Column({ comment: '权限描述', nullable: true, type: 'text' })
    description?: string;

    /**
     * 权限规则
     */
    @Column({ type: 'simple-json', comment: '权限规则' })
    rule: Omit<RawRuleFrom<P, T>, 'conditions'>;

    /**
     * 权限角色
     */
    @Expose({ groups: ['permission-list', 'permission-detail'] })
    @ManyToMany(() => RoleEntity, (role) => role.permissions)
    @JoinTable()
    roles: Relation<RoleEntity>[];

    /**
     * 权限用户
     */
    @ManyToMany(() => UserEntity, (user) => user.permissions)
    @JoinTable()
    users: Relation<UserEntity>[];
}
