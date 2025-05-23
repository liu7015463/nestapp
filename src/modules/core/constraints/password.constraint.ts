import {
    ValidationArguments,
    ValidatorConstraintInterface,
    ValidationOptions,
    registerDecorator,
} from 'class-validator';

type ModelType = 1 | 2 | 3 | 4 | 5;

export class PasswordConstraint implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        const validateModel: ModelType = validationArguments.constraints[0] ?? 1;
        switch (validateModel) {
            case 1:
                return /\d/.test(value) && /[A-Za-z]/.test(value);
            case 2:
                return /\d/.test(value) && /[a-z]/.test(value);
            case 3:
                return /\d/.test(value) && /[A-Z]/.test(value);
            case 4:
                return /\d/.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value);
            case 5:
                return (
                    /\d/.test(value) &&
                    /[A-Z]/.test(value) &&
                    /[a-z]/.test(value) &&
                    /[!@#$%^&]/.test(value)
                );
            default:
                return /\d/.test(value) && /[A-Za-z]/.test(value);
        }
    }
    defaultMessage?(validationArguments?: ValidationArguments): string {
        return "($value) 's format error";
    }
}

export function IsPassword(model?: ModelType, validationOptions?: ValidationOptions) {
    return (object: RecordAny, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [model],
            validator: PasswordConstraint,
        });
    };
}
