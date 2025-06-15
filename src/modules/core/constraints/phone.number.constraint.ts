import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { isMobilePhone, IsMobilePhoneOptions, MobilePhoneLocale } from 'validator';

export function isMatchPhone(
    value: any,
    locale: MobilePhoneLocale,
    options?: IsMobilePhoneOptions,
): boolean {
    if (!value) {
        return false;
    }
    const phoneArr: string[] = value.split('.');
    if (phoneArr.length !== 2) {
        return false;
    }
    return isMobilePhone(phoneArr.join(''), locale, options);
}

export function IsMatchPhone(
    locales?: MobilePhoneLocale | MobilePhoneLocale[],
    options?: IsMobilePhoneOptions,
    validationOptions?: ValidationOptions,
) {
    return (object: RecordAny, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [locales || 'any', options],
            validator: {
                validate: (value: any, args: ValidationArguments): boolean =>
                    isMatchPhone(value, args.constraints[0], args.constraints[1]),
                defaultMessage: (_args: ValidationArguments) =>
                    '$property must be a phone number,eg: +86.12345678901',
            },
        });
    };
}
