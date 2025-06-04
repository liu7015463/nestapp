import { Injectable } from '@nestjs/common';
import { isNil, omit } from 'lodash';
import { EntityNotFoundError } from 'typeorm';

import { CreateCategoryDto, UpdateCategoryDto } from '@/modules/content/dtos/category.dto';
import { CategoryEntity } from '@/modules/content/entities/category.entity';
import { CategoryRepository } from '@/modules/content/repositories/category.repository';
import { BaseService } from '@/modules/database/base/service';

@Injectable()
export class CategoryService extends BaseService<CategoryEntity, CategoryRepository> {
    protected enableTrash = true;

    constructor(protected repository: CategoryRepository) {
        super(repository);
    }

    async findTrees() {
        return this.repository.findTrees();
    }

    async detail(id: string) {
        return this.repository.findOneOrFail({ where: { id }, relations: ['parent', 'children'] });
    }

    async create(data: CreateCategoryDto) {
        const item = await this.repository.save({
            ...data,
            parent: await this.getParent(undefined, data.parent),
        });
        return this.detail(item.id);
    }

    async update(data: UpdateCategoryDto) {
        await this.repository.update(data.id, omit(data, ['id', 'parent']));
        const item = await this.repository.findOneOrFail({
            where: { id: data.id },
            relations: ['parent'],
        });
        const parent = await this.getParent(item.parent?.id, data.parent);
        const shouldUpdateParent =
            (!isNil(item.parent) && !isNil(parent) && item.parent.id !== parent.id) ||
            (!isNil(item.parent) && !isNil(parent)) ||
            (!isNil(item.parent) && isNil(parent));

        if (shouldUpdateParent && parent !== undefined) {
            item.parent = parent;
            await this.repository.save(item, { reload: true });
        }
        return item;
    }

    async getParent(current?: string, parentId?: string) {
        if (current === parentId) {
            return undefined;
        }
        let parent: CategoryEntity | undefined;
        if (parentId !== undefined) {
            if (parentId === null) {
                return null;
            }
            parent = await this.repository.findOne({ where: { id: parentId } });
            if (!parent) {
                throw new EntityNotFoundError(
                    CategoryEntity,
                    `Parent category with id ${parentId} not exists!`,
                );
            }
        }
        return parent;
    }
}
