import { Controller, Get, Param, ParseUUIDPipe, Query, SerializeOptions } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { PermissionAction } from '@/modules/rbac/constants';
import { Permission } from '@/modules/rbac/decorators/permission.decorator';
import { PermissionEntity } from '@/modules/rbac/entities';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionService } from '@/modules/rbac/services';
import { PermissionChecker } from '@/modules/rbac/types';
import { Depends } from '@/modules/restful/decorators/depend.decorator';
import { PaginateWithTrashedDto } from '@/modules/restful/dtos/paginate-width-trashed.dto';

const permission: PermissionChecker = async (ab) =>
    ab.can(PermissionAction.MANAGE, PermissionEntity.name);

@ApiTags('权限管理')
@ApiBearerAuth()
@Depends(RbacModule)
@Controller('permissions')
export class PermissionController {
    constructor(private service: PermissionService) {}

    /**
     * 分页列表查询
     * @param options
     */
    @Get()
    @SerializeOptions({ groups: ['permission-list'] })
    @Permission(permission)
    async list(@Query() options: PaginateWithTrashedDto) {
        return this.service.paginate(options);
    }

    /**
     * 分页列表查询
     * @param id
     */
    @Get(':id')
    @SerializeOptions({ groups: ['permission-detail'] })
    @Permission(permission)
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }
}
