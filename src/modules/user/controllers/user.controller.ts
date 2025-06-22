import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    SerializeOptions,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { DeleteWithTrashDto, RestoreDto } from '@/modules/content/dtos/delete.with.trash.dto';
import { Depends } from '@/modules/restful/decorators/depend.decorator';
import { UserModule } from '@/modules/user/user.module';

import { Guest } from '../decorators/guest.decorator';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@ApiTags('用户管理')
@Depends(UserModule)
@Controller('users')
export class UserController {
    constructor(protected service: UserService) {}

    /**
     * 用户列表
     */
    @Get()
    @Guest()
    @SerializeOptions({ groups: ['user-list'] })
    async list() {
        return this.service.list();
    }

    /**
     * 获取用户信息
     * @param id
     */
    @Get(':id')
    @Guest()
    @SerializeOptions({ groups: ['user-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    /**
     * 新增用户
     * @param data
     */
    @Post()
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['user-detail'] })
    async store(@Body() data: CreateUserDto) {
        return this.service.create(data);
    }

    /**
     * 更新用户
     * @param data
     */
    @Patch()
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['user-detail'] })
    async update(@Body() data: UpdateUserDto) {
        return this.service.update(data);
    }

    /**
     * 批量删除用户
     * @param data
     */
    @Delete()
    @ApiBearerAuth()
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
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['user-list'] })
    async restore(@Body() data: RestoreDto) {
        const { ids } = data;
        return this.service.restore(ids);
    }
}
