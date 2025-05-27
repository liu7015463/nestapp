import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
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

export class UniqueExistConstraint implements ValidatorConstraintInterface {
    constructor(protected dataSource: DataSource) {}

    async validate(value: any, args?: ValidationArguments): Promise<boolean> {
        const config: Omit<Condition, 'entity'> = {
            ignore: 'id',
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            : { ...config, entity: args.constraints[0] }) as unknown as Required<Condition>;
        if (!condition.entity) {
            return false;
        }
        const ignoreValue = (args.object as any)[
            isNil(condition.ignoreKey) ? condition.ignore : condition.ignoreKey
        ];
        if (ignoreValue === undefined) {
            return false;
        }
        const repo = this.dataSource.getRepository(condition.entity);
        return isNil(
            await repo.findOne({
                where: { [condition.property]: value, [condition.ignore]: Not(ignoreValue) },
                withDeleted: true,
            }),
        );
    }
    defaultMessage?(args?: ValidationArguments): string {
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

export function IsUniqueExist(params: ObjectType<any> | Condition, options?: ValidationOptions) {
    return (object: RecordAny, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options,
            constraints: [params],
            validator: UniqueExistConstraint,
        });
    };
}
