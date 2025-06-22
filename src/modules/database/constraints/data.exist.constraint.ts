import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { isArray, isNil } from 'lodash';
import { DataSource, ObjectType, Repository } from 'typeorm';

type Condition = {
    entity: ObjectType<any>;
    map?: string;
};

@ValidatorConstraint({ name: 'dataExist', async: true })
@Injectable()
export class DataExistConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    errorValues: any[] = [];

    async validate(value: any, validationArguments?: ValidationArguments) {
        let repo: Repository<any>;
        if (isNil(value)) {
            return true;
        }
        let map = 'id';
        if ('entity' in validationArguments.constraints[0]) {
            map = validationArguments.constraints[0].map ?? 'id';
            repo = this.dataSource.getRepository(validationArguments.constraints[0].entitiy);
        } else {
            repo = this.dataSource.getRepository(validationArguments.constraints[0]);
        }
        if (isArray(value)) {
            const values = value as any[];
            const validationResults = await Promise.all(
                values.map(async (val) => {
                    if (isNil(val)) {
                        return false;
                    }
                    const item = await repo.findOne({ where: { [map]: val } });
                    if (isNil(item)) {
                        this.errorValues.push(val);
                    }
                    return !isNil(item);
                }),
            );
            return validationResults.every((isValid) => isValid);
        }
        const item = await repo.findOne({ where: { [map]: value } });
        return !!item;
    }

    defaultMessage?(validationArguments?: ValidationArguments): string {
        if (!validationArguments.constraints[0]) {
            return 'Model not been specified!';
        }
        if (this.errorValues.length > 0) {
            return `All instance of ${
                validationArguments.constraints[0].name
            } must been exists in databse!Errors are ${this.errorValues.join(',')}`;
        }
        return `All instance of ${validationArguments.constraints[0].name} must been exists in databse!`;
    }
}

function IsDataExist(
    entity: ObjectType<any>,
    validationOptions?: ValidationOptions,
): (object: RecordAny, propertyName: string) => void;

function IsDataExist(
    condition: Condition,
    validationOptions?: ValidationOptions,
): (object: RecordAny, propertyName: string) => void;

function IsDataExist(
    condition: Condition | ObjectType<any>,
    validationOptions?: ValidationOptions,
): (object: RecordAny, propertyName: string) => void {
    return (object: RecordAny, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [condition],
            validator: DataExistConstraint,
        });
    };
}

export { IsDataExist };
