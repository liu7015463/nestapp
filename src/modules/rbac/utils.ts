import { MongoAbility } from '@casl/ability';
import { FastifyRequest as Request } from 'fastify';
import { ObjectLiteral } from 'typeorm';

import { PermissionAction } from './constants';

function getRequestData(request: Request, key: string): string[] {
    return [];
}

export async function checkOwnerPermission<T extends ObjectLiteral>(
    ability: MongoAbility,
    options: {
        request: Request;
        key?: string;
        getData: (items: string[]) => Promise<T[]>;
        permission?: string;
    },
): Promise<boolean> {
    const { request, key, getData, permission } = options;
    const models = await getData(getRequestData(request, key));
    return models.every((model) => ability.can(permission ?? PermissionAction.OWNER, model));
}
