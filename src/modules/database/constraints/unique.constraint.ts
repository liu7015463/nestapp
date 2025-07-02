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
    property?: string;
};

@Injectable()
@ValidatorConstraint({ name: 'dataUnique', async: true })
export class UniqueConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {
        if (isNil(value)) {
            return true;
        }
        const config: Omit<Condition, 'entity'> = { property: validationArguments.property };
        const condition = ('entity' in validationArguments.constraints[0]
            ? merge(config, validationArguments.constraints[0])
            : {
                  ...config,
                  entity: validationArguments.constraints[0],
              }) as unknown as Required<Condition>;
        if (!condition.entity) {
            return false;
        }
        try {
            const repo = this.dataSource.getRepository(condition.entity);
            return isNil(
                await repo.findOne({ where: { [condition.property]: value }, withDeleted: true }),
            );
        } catch (err) {
            return false;
        }
    }

    defaultMessage?(validationArguments?: ValidationArguments): string {
        const { entity, property } = validationArguments.constraints[0];
        const queryProperty = property ?? validationArguments.property;
        if (!(validationArguments.object as any).getManager) {
            return 'getManager function not been found!';
        }
        if (!entity) {
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique!`;
    }
}

export function IsUnique(
    params: ObjectType<any> | Condition,
    validationOptions: ValidationOptions,
) {
    return (object: RecordAny, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: UniqueConstraint,
        });
    };
}
