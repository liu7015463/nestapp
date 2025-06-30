import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    SerializeOptions,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { DeleteWithTrashDto, RestoreDto } from '@/modules/content/dtos/delete.with.trash.dto';
import { PermissionAction } from '@/modules/rbac/constants';
import { Permission } from '@/modules/rbac/decorators/permission.decorator';
import { PermissionChecker } from '@/modules/rbac/types';
import { Depends } from '@/modules/restful/decorators/depend.decorator';
import { CreateUserDto, FrontedQueryUserDto, UpdateUserDto } from '@/modules/user/dtos/user.dto';
import { UserEntity } from '@/modules/user/entities';
import { UserService } from '@/modules/user/services';
import { UserModule } from '@/modules/user/user.module';

const permission: PermissionChecker = async (ab) =>
    ab.can(PermissionAction.MANAGE, UserEntity.name);

@ApiTags('用户管理')
@Depends(UserModule)
@ApiBearerAuth()
@Controller('users')
export class UserController {
    constructor(protected service: UserService) {}

    /**
     * 用户列表
     */
    @Get()
    @Permission(permission)
    @SerializeOptions({ groups: ['user-list'] })
    async list(@Query() options: FrontedQueryUserDto) {
        return this.service.list(options);
    }

    /**
     * 获取用户信息
     * @param id
     */
    @Get(':id')
    @Permission(permission)
    @SerializeOptions({ groups: ['user-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    /**
     * 新增用户
     * @param data
     */
    @Post()
    @Permission(permission)
    @SerializeOptions({ groups: ['user-detail'] })
    async store(@Body() data: CreateUserDto) {
        return this.service.create(data);
    }

    /**
     * 更新用户
     * @param data
     */
    @Patch()
    @Permission(permission)
    @SerializeOptions({ groups: ['user-detail'] })
    async update(@Body() data: UpdateUserDto) {
        return this.service.update(data);
    }

    /**
     * 批量删除用户
     * @param data
     */
    @Delete()
    @Permission(permission)
    @SerializeOptions({ groups: ['user-list'] })
    async delete(@Body() data: DeleteWithTrashDto) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    /**
     * 批量恢复用户
     * @param data
     */
    @Patch('restore')
    @Permission(permission)
    @SerializeOptions({ groups: ['user-list'] })
    async restore(@Body() data: RestoreDto) {
        const { ids } = data;
        return this.service.restore(ids);
    }
}
