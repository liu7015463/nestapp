import { MongoAbility } from '@casl/ability';
import { FastifyRekquest as Request } from 'fastify';
import { ObjectLiteral } from 'typeorm';

import { PermissionAction } from './constants';

export async function checkOwnerPermission<T extends ObjectLiteral>(
    ability: MongoAbility,
    options: {
        request: Request;
        key?: string;
        getData: (items: string[]) => Promise<T[]>;
        permission?: string;
    },
) {
    const { request, key, getData, permission } = options;
    const models = await getData(getRequestData(request, key));
    return models.every((model) => ability.can(permission ?? PermissionAction.OWNER, model));
}
