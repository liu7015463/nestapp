import { PartialType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { IsDataExist } from '@/modules/database/constraints';
import { IsUnique } from '@/modules/database/constraints/unique.constraint';
import { IsUniqueExist } from '@/modules/database/constraints/unique.exist.constraint';

import { TagEntity } from '../entities';

@DtoValidation({ groups: ['create'] })
export class CreateTagDto {
    @IsUnique(TagEntity, { groups: ['create'], message: 'The label names are repeated' })
    @IsUniqueExist(TagEntity, { groups: ['update'], message: 'The label names are repeated' })
    @MaxLength(255, {
        always: true,
        message: 'The maximum length of the label name is $constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: 'The classification name cannot be empty' })
    @IsOptional({ groups: ['update'] })
    name: string;

    @MaxLength(500, {
        always: true,
        message: 'The maximum length of the label description is $constraint1',
    })
    @IsOptional({ always: true })
    desc?: string;
}

@DtoValidation({ groups: ['update'] })
export class UpdateTagDto extends PartialType(CreateTagDto) {
    @IsDataExist(TagEntity, { groups: ['update'], message: 'tag id not exist when update' })
    @IsUUID(undefined, { message: 'The ID format is incorrect', groups: ['update'] })
    @IsDefined({ groups: ['update'], message: 'The ID must be specified' })
    id: string;
}
