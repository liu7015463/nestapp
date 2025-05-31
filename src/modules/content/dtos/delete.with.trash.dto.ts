import { Transform } from 'class-transformer';

import { IsBoolean, IsDefined, IsOptional, IsUUID } from 'class-validator';
import { toBoolean } from 'validator';

import { DeleteDto } from './delete.dto';

export class DeleteWithTrashDto extends DeleteDto {
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    trash?: boolean;
}

export class RestoreDto {
    @IsUUID(undefined, { each: true, always: true, message: 'The ID format is incorrect' })
    @IsDefined({ each: true, message: 'The ID must be specified' })
    ids: string[];
}
