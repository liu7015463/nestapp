import { Paramtype, SetMetadata } from '@nestjs/common';
import { ClassTransformOptions } from 'class-transformer';
import { ValidationOptions } from 'class-validator';

import { DTO_VALIDATION_OPTIONS } from '../contants';

export const DtoValidation = (
    options?: ValidationOptions & { transformOptions?: ClassTransformOptions } & {
        type?: Paramtype;
    },
) => SetMetadata(DTO_VALIDATION_OPTIONS, options ?? {});
