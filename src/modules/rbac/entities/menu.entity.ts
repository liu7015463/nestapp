import { Exclude, Expose, Type } from 'class-transformer';
import type { Relation } from 'typeorm';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { MenuPermissionType } from '../types';

import { PermissionEntity } from './permission.entity';

/**
 * 菜单实体
 */
@Exclude()
@Entity('rbac_menu')
export class MenuEntity extends BaseEntity {
    /**
     * 菜单ID
     */
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * 父级菜单ID
     */
    @Expose()
    @Column({ comment: '父级菜单ID', nullable: true })
    parentId?: string;

    /**
     * 菜单名称
     */
    @Expose()
    @Column({ comment: '菜单名称' })
    name: string;

    /**
     * 菜单编码
     */
    @Expose()
    @Column({ comment: '菜单编码', unique: true })
    code: string;

    /**
     * 菜单路径
     */
    @Expose()
    @Column({ comment: '菜单路径', nullable: true })
    path?: string;

    /**
     * 菜单图标
     */
    @Expose()
    @Column({ comment: '菜单图标', nullable: true })
    icon?: string;

    /**
     * 菜单标题
     */
    @Expose()
    @Column({ comment: '菜单标题', nullable: true })
    caption?: string;

    /**
     * 菜单信息
     */
    @Expose()
    @Column({ comment: '菜单信息', nullable: true })
    info?: string;

    /**
     * 是否禁用
     */
    @Expose()
    @Column({ comment: '是否禁用', default: false })
    disabled?: boolean;

    /**
     * 是否隐藏
     */
    @Expose()
    @Column({ comment: '是否隐藏', default: false })
    hidden?: boolean;

    /**
     * 外部链接
     */
    @Expose()
    @Column({ comment: '外部链接', nullable: true })
    externalLink?: string;

    /**
     * 组件
     */
    @Expose()
    @Column({ comment: '组件', nullable: true })
    component?: string;

    /**
     * 排序
     */
    @Expose()
    @Column({ comment: '自定义菜单排序', default: 0 })
    customOrder?: number;

    /**
     * 权限类型
     */
    @Expose()
    @Column({
        comment: '权限类型',
        type: 'enum',
        enum: MenuPermissionType,
        default: MenuPermissionType.MENU,
    })
    type: MenuPermissionType;

    /**
     * 创建时间
     */
    @Expose()
    @Type(() => Date)
    @CreateDateColumn({ comment: '创建时间' })
    createdAt: Date;

    /**
     * 更新时间
     */
    @Expose()
    @Type(() => Date)
    @UpdateDateColumn({ comment: '更新时间' })
    updatedAt: Date;

    /**
     * 关联权限
     */
    @Expose({ groups: ['menu-detail'] })
    @Type(() => PermissionEntity)
    @OneToOne(() => PermissionEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    permission?: Relation<PermissionEntity>;

    /**
     * 父级菜单
     */
    @Expose({ groups: ['menu-detail'] })
    @Type(() => MenuEntity)
    @ManyToOne(() => MenuEntity, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent?: Relation<MenuEntity>;
}
