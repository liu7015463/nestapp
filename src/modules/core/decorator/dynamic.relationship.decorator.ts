import { ObjectLiteral } from 'typeorm';

import { ADDTIONAL_RELATIONSHIPS } from '../contants';
import { DynamicRelation } from '../types';

export function AddRelations(relations: () => Array<DynamicRelation>) {
    return <T extends ObjectLiteral>(target: T) => {
        Reflect.defineMetadata(ADDTIONAL_RELATIONSHIPS, relations, target);
        return target;
    };
}
