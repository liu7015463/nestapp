import { IsOptional, IsUUID } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { IsDataExist } from '@/modules/database/constraints';
import { PaginateDto } from '@/modules/restful/dtos/paginate.dto';

import { RoleEntity } from '../entities/role.entity';

@DtoValidation({ type: 'query' })
export class QueryPermissionDto extends PaginateDto {
    /**
     * 角色ID:通过角色过滤权限列表
     */
    @IsDataExist(RoleEntity, { groups: ['update'], message: '指定的角色不存在' })
    @IsUUID(undefined, { message: '角色ID格式错误' })
    @IsOptional()
    role?: string;
}
