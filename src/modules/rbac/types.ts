/* eslint-disable import/no-extraneous-dependencies */
import { AbilityTuple, MongoAbility, MongoQuery, RawRuleFrom } from '@casl/ability';

import { ModuleRef } from '@nestjs/core';

import { FastifyRequest as Request } from 'fastify';

import { UserEntity } from '../user/entities';

import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';

export type Role = Pick<ClassToPlain<RoleEntity>, 'name' | 'label' | 'description'> & {
    permissions: string[];
};

export type PermissionType<P extends AbilityTuple, T extends MongoQuery> = Pick<
    ClassToPlain<PermissionEntity<P, T>>,
    'name'
> &
    Partial<Pick<ClassToPlain<PermissionEntity<P, T>>, 'label' | 'description'>> & {
        rule: Omit<RawRuleFrom<P, T>, 'conditions'> & {
            conditions?: (user: ClassToPlain<UserEntity>) => RecordAny;
        };
    };

export type PermissionChecker = (
    ability: MongoAbility,
    ref?: ModuleRef,
    request?: Request,
) => Promise<boolean>;
