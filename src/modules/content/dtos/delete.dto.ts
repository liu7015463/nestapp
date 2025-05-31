import { IsUUID, IsDefined } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';

@DtoValidation()
export class DeleteDto {
    @IsUUID(undefined, { each: true, always: true, message: 'The ID format is incorrect' })
    @IsDefined({ each: true, message: 'The ID must be specified' })
    ids: string[];
}
