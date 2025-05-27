import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { isNil, merge } from 'lodash';
import { DataSource, Not, ObjectType } from 'typeorm';

type Condition = {
    entity: ObjectType<any>;

    ignore?: string;

    ignoreKey?: string;

    property?: string;
};

@ValidatorConstraint({ name: 'treeDataUniqueExist', async: true })
@Injectable()
export class TreeUniqueExistContraint implements ValidatorConstraintInterface {
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
        // 在传入的dto数据中获取需要忽略的字段的值
        const ignoreValue = (args.object as any)[
            isNil(condition.ignoreKey) ? condition.ignore : condition.ignoreKey
        ];
        // 如果忽略字段不存在则验证失败
        if (ignoreValue === undefined) {
            return false;
        }
        // 通过entity获取repository
        const repo = this.dataSource.getRepository(condition.entity);
        // 查询忽略字段之外的数据是否对queryProperty的值唯一
        return isNil(
            await repo.findOne({
                where: {
                    [condition.property]: value,
                    [condition.ignore]: Not(ignoreValue),
                },
                withDeleted: true,
            }),
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

export function IsUniqueExist(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: TreeUniqueExistContraint,
        });
    };
}
