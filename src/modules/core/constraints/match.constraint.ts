import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isMatch' })
export class MatchConstraint implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        const [relatedProperty, reverse] = validationArguments.constraints;
        const relatedValue = (validationArguments.object as any)[relatedProperty];
        return (value === relatedValue) !== reverse;
    }
    defaultMessage?(validationArguments?: ValidationArguments): string {
        const [relatedProperty, reverse] = validationArguments.constraints;
        return `${relatedProperty} and ${validationArguments.property} ${
            reverse ? `is` : `don't`
        } match`;
    }
}

export function IsMatch(
    relatedProperty: string,
    reverse = false,
    validationOptions?: ValidationOptions,
) {
    return (object: RecordAny, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [relatedProperty, reverse],
            validator: MatchConstraint,
        });
    };
}
