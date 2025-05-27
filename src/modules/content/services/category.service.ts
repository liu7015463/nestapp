import { Injectable } from '@nestjs/common';
import { isNil, omit } from 'lodash';
import { EntityNotFoundError } from 'typeorm';

import {
    CreateCategoryDto,
    QueryCategoryDto,
    UpdateCategoryDto,
} from '@/modules/content/dtos/category.dto';
import { CategoryEntity } from '@/modules/content/entities/category.entity';
import { CategoryRepository } from '@/modules/content/repositories/category.repository';
import { treePaginate } from '@/modules/database/utils';

@Injectable()
export class CategoryService {
    constructor(protected repository: CategoryRepository) {}

    async findTrees() {
        return this.repository.findTrees();
    }

    async paginate(options?: QueryCategoryDto) {
        const tree = await this.findTrees();
        const data = await this.repository.toFlatTrees(tree);
        return treePaginate(options, data);
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

    async delete(id: string) {
        const item = await this.repository.findOneOrFail({
            where: { id },
            relations: ['parent', 'children'],
        });
        if (!isNil(item.children) && item.children.length > 0) {
            const childrenCategories = [...item.children].map((c) => {
                c.parent = item.parent;
                return item;
            });
            await this.repository.save(childrenCategories, { reload: true });
        }
        return this.repository.remove(item);
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
