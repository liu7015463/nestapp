import { ArgumentMetadata, BadRequestException, Paramtype, ValidationPipe } from '@nestjs/common';

import { isObject, omit } from 'lodash';

import { DTO_VALIDATION_OPTIONS } from '../contants';
import { deepMerge } from '../helpers';

export class AppPipe extends ValidationPipe {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        const { metatype, type } = metadata;
        const dto = metatype as any;
        const options = Reflect.getMetadata(DTO_VALIDATION_OPTIONS, dto) || {};
        const originOptions = { ...this.validatorOptions };
        const originTransform = { ...this.transformOptions };
        const { transformOptions, type: optionsType, ...customOptions } = options;
        const requestBody: Paramtype = optionsType ?? 'body';
        if (requestBody !== type) {
            return value;
        }
        if (transformOptions) {
            this.transformOptions = deepMerge(
                this.transformOptions,
                transformOptions ?? {},
                'replace',
            );
        }
        this.validatorOptions = deepMerge(this.validatorOptions, customOptions ?? {}, 'replace');
        const toValidate = isObject(value)
            ? Object.fromEntries(
                  Object.entries(value as RecordAny).map(([key, val]) => {
                      if (isObject(val) && 'mimetype' in val) {
                          return [key, omit(val, ['fields'])];
                      }
                      return [key, val];
                  }),
              )
            : value;
        console.log(value);
        console.log(toValidate);
        try {
            let result = await super.transform(toValidate, metadata);
            if (typeof result.transform === 'function') {
                result = await result.transform(result);
                const { transform, ...data } = result;
                result = data;
            }
            this.validatorOptions = originOptions;
            this.transformOptions = originTransform;
            return result;
        } catch (error: any) {
            this.validatorOptions = originOptions;
            this.transformOptions = originTransform;
            if ('response' in error) {
                throw new BadRequestException(error.response);
            }
            throw new BadRequestException(error);
        }
    }
}
