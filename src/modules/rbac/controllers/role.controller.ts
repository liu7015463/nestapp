import { Controller, Get, Param, ParseUUIDPipe, Query, SerializeOptions } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RbacModule } from '@/modules/rbac/rbac.module';
import { RoleService } from '@/modules/rbac/services';
import { Depends } from '@/modules/restful/decorators/depend.decorator';
import { PaginateWithTrashedDto } from '@/modules/restful/dtos/paginate-width-trashed.dto';
import { Guest } from '@/modules/user/decorators/guest.decorator';

@ApiTags('角色查询')
@Depends(RbacModule)
@Controller('roles')
export class RoleController {
    constructor(private service: RoleService) {}

    /**
     * 角色列表查询
     * @param options
     */
    @Get()
    @SerializeOptions({ groups: ['role-list'] })
    @Guest()
    async list(@Query() options: PaginateWithTrashedDto) {
        return this.service.paginate(options);
    }

    /**
     * 角色详解查询
     * @param id
     */
    @Get(':id')
    @SerializeOptions({ groups: ['role-detail'] })
    @Guest()
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }
}
