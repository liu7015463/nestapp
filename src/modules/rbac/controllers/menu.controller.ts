import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    SerializeOptions,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Depends } from '@/modules/restful/decorators/depend.decorator';
import { Guest } from '@/modules/user/decorators/guest.decorator';

import { CreateMenuDto, QueryMenuDto, UpdateMenuDto } from '../dtos/menu.dto';
import { RbacModule } from '../rbac.module';
import { MenuService } from '../services/menu.service';

/**
 * 菜单管理控制器
 */
@ApiTags('菜单管理')
@Depends(RbacModule)
@Guest()
@Controller('menus')
export class MenuController {
    constructor(protected service: MenuService) {}

    /**
     * 分页查询菜单列表
     */
    @Get()
    @ApiOperation({ summary: '分页查询菜单列表' })
    @SerializeOptions({ groups: ['menu-list'] })
    async list(@Query() options: QueryMenuDto) {
        return this.service.paginate(options);
    }

    /**
     * 查询菜单详情
     */
    @Get(':id')
    @ApiOperation({ summary: '查询菜单详情' })
    @SerializeOptions({ groups: ['menu-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    /**
     * 创建菜单
     */
    @Post()
    @ApiOperation({ summary: '创建菜单' })
    @SerializeOptions({ groups: ['menu-detail'] })
    async create(@Body() data: CreateMenuDto) {
        return this.service.create(data);
    }

    /**
     * 更新菜单
     */
    @Put(':id')
    @ApiOperation({ summary: '更新菜单' })
    @SerializeOptions({ groups: ['menu-detail'] })
    async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: UpdateMenuDto) {
        return this.service.update({ ...data, id });
    }

    /**
     * 删除菜单
     */
    @Delete(':id')
    @ApiOperation({ summary: '删除菜单' })
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete([id]);
    }

    /**
     * 获取菜单树
     */
    @Get('tree')
    @ApiOperation({ summary: '获取菜单树结构' })
    @SerializeOptions({ groups: ['menu-list'] })
    async getMenuTree() {
        return this.service.getMenuTree();
    }

    /**
     * 根据权限获取可访问菜单
     */
    @Get('accessible')
    @ApiOperation({ summary: '获取用户可访问的菜单' })
    @SerializeOptions({ groups: ['menu-list'] })
    async getAccessibleMenus(@Query('permissions') permissions?: string) {
        const permissionList = permissions ? permissions.split(',') : [];
        return this.service.getAccessibleMenus(permissionList);
    }

    /**
     * 根据父级ID获取子菜单
     */
    @Get('children')
    @ApiOperation({ summary: '根据父级ID获取子菜单' })
    @SerializeOptions({ groups: ['menu-list'] })
    async getChildrenMenus(@Query('parentId') parentId?: string) {
        return this.service.findByParentId(parentId);
    }
}
