import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { isNil, merge } from 'lodash';
import { DataSource, ObjectType } from 'typeorm';

type Condition = {
    entity: ObjectType<any>;

    parentKey?: string;

    property?: string;
};

@ValidatorConstraint({ name: 'treeDataUnique', async: true })
@Injectable()
export class TreeUniqueConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: any, args: ValidationArguments) {
        // 获取要验证的模型和字段
        const config: Omit<Condition, 'entity'> = {
            parentKey: 'parent',
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
        if (isNil(value)) {
            return true;
        }
        const argsObj = args.object as any;
        try {
            // 查询是否存在数据,如果已经存在则验证失败
            const repo = this.dataSource.getTreeRepository(condition.entity);
            const collections = await repo.find({
                where: {
                    parent: !argsObj[condition.parentKey]
                        ? null
                        : { id: argsObj[condition.parentKey] },
                },
            });
            return collections.every((item) => item[condition.property] !== value);
        } catch (err) {
            // 如果数据库操作异常则验证失败
            return false;
        }
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

export function IsTreeUnique(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: TreeUniqueConstraint,
        });
    };
}
