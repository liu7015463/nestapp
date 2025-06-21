import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { merge } from 'lodash';
import { DataSource, ObjectType } from 'typeorm';

type Condition = {
    entity: ObjectType<any>;

    ignore?: string;

    ignoreKey?: string;

    property?: string;
};

@ValidatorConstraint({ name: 'treeDataUniqueExist', async: true })
@Injectable()
export class TreeUniqueExistConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: any, args: ValidationArguments) {
        const config: Omit<Condition, 'entity'> = {
            ignore: 'id',
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            : {
                  ...config,
                  entity: args.constraints[0],
              }) as unknown as Required<Condition>;
        if (!condition.entity) {
            return false;
        }
        if (!condition.ignoreKey) {
            condition.ignoreKey = condition.ignore;
        }
        const argsObj = args.object as any;
        // 在传入的dto数据中获取需要忽略的字段的值
        const ignoreValue = argsObj[condition.ignore];
        const findValue = argsObj[condition.ignoreKey];
        if (!ignoreValue || !findValue) {
            return false;
        }

        // 通过entity获取repository
        const repo = this.dataSource.getRepository(condition.entity);
        // 查询忽略字段之外的数据是否对queryProperty的值唯一
        const item = await repo.findOne({
            where: {
                [condition.ignoreKey]: findValue,
            },
            relations: ['parent'],
        });
        if (!item) {
            return false;
        }
        const rows = await repo.find({
            where: { parent: item.parent ? { id: item.parent.id } : null },
            withDeleted: true,
        });
        return !rows.find(
            (row) => row[condition.property] === value && row[condition.ignore] !== ignoreValue,
        );
    }

    defaultMessage(args: ValidationArguments) {
        const { entity, property } = args.constraints[0];
        const queryProperty = property ?? args.property;
        if (!(args.object as any).getManager) {
            return 'getManager function not been found!';
        }
        if (!entity) {
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique!`;
    }
}

export function IsTreeUniqueExist(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: TreeUniqueExistConstraint,
        });
    };
}
