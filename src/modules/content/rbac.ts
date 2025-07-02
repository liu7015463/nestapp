import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import { PermissionAction, SystemRoles } from '@/modules/rbac/constants';
import { PermissionEntity, RoleEntity } from '@/modules/rbac/entities';
import { RbacResolver } from '@/modules/rbac/rbac.resolver';
import { UserEntity } from '@/modules/user/entities';

@Injectable()
export class ContentRbac implements OnModuleInit {
    constructor(private ref: ModuleRef) {}
    onModuleInit() {
        const resolver = this.ref.get(RbacResolver, { strict: false });
        resolver.addPermissions([
            {
                name: 'post.create',
                rule: {
                    action: PermissionAction.CREATE,
                    subject: PostEntity,
                },
            },
            {
                name: 'post.owner',
                rule: {
                    action: PermissionAction.OWNER,
                    subject: PostEntity,
                    conditions: (user) => ({
                        'author.id': user.id,
                    }),
                },
            },
            {
                name: 'comment.create',
                rule: {
                    action: PermissionAction.CREATE,
                    subject: CommentEntity,
                },
            },
            {
                name: 'comment.owner',
                rule: {
                    action: PermissionAction.OWNER,
                    subject: CommentEntity,
                    conditions: (user) => ({
                        'author.id': user.id,
                    }),
                },
            },
            {
                name: 'post.manage',
                rule: {
                    action: PermissionAction.MANAGE,
                    subject: PostEntity,
                },
            },
            {
                name: 'tag.manage',
                rule: {
                    action: PermissionAction.MANAGE,
                    subject: TagEntity,
                },
            },
            {
                name: 'category.manage',
                rule: {
                    action: PermissionAction.MANAGE,
                    subject: CategoryEntity,
                },
            },
            {
                name: 'comment.manage',
                rule: {
                    action: PermissionAction.MANAGE,
                    subject: CommentEntity,
                },
            },
            {
                name: 'permission.manage',
                rule: {
                    action: PermissionAction.MANAGE,
                    subject: PermissionEntity,
                },
            },
            {
                name: 'role.manage',
                rule: {
                    action: PermissionAction.MANAGE,
                    subject: RoleEntity,
                },
            },
            {
                name: 'user.manage',
                rule: {
                    action: PermissionAction.MANAGE,
                    subject: UserEntity,
                },
            },
        ]);

        resolver.addRoles([
            {
                name: SystemRoles.USER,
                permissions: [
                    'post.read',
                    'post.create',
                    'post.owner',
                    'comment.create',
                    'comment.owner',
                ],
            },
            {
                name: 'content-manage',
                label: '内容管理员',
                description: '管理内容模块',
                permissions: ['post.manage', 'category.manage', 'tag.manage', 'comment.manage'],
            },
        ]);
    }
}
