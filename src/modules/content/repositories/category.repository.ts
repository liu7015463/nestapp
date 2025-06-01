import { isNil, pick, unset } from 'lodash';
import { FindOptionsUtils, FindTreeOptions, TreeRepository, TreeRepositoryUtils } from 'typeorm';

import { CategoryEntity } from '@/modules/content/entities/category.entity';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

@CustomRepository(CategoryEntity)
export class CategoryRepository extends TreeRepository<CategoryEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('category').leftJoinAndSelect('category.parent', 'parent');
    }

    async findTrees(options?: FindTreeOptions) {
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    findRoots(options?: FindTreeOptions): Promise<CategoryEntity[]> {
        const escape = (val: string) => this.manager.connection.driver.escape(val);
        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;
        const qb = this.buildBaseQB().orderBy('category.customOrder', 'ASC');
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        return qb.where(`${escape('category')}.${escape(parentPropertyName)} IS NULL`).getMany();
    }

    findDescendants(entity: CategoryEntity, options?: FindTreeOptions): Promise<CategoryEntity[]> {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy('category.customOrder', 'ASC');
        return qb.getMany();
    }

    findAncestors(entity: CategoryEntity, options?: FindTreeOptions): Promise<CategoryEntity[]> {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy('category.customOrder', 'ASC');
        return qb.getMany();
    }

    async findDescendantsTree(entity: CategoryEntity, options?: FindTreeOptions) {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity)
            .leftJoinAndSelect('category.parent', 'parent')
            .orderBy('category.customOrder', 'ASC');
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            'category',
            entities.raw,
        );
        TreeRepositoryUtils.buildChildrenEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
            { depth: -1, ...pick(options, ['relations']) },
        );
        return entity;
    }

    async findAncestorsTree(
        entity: CategoryEntity,
        options?: FindTreeOptions,
    ): Promise<CategoryEntity> {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity)
            .leftJoinAndSelect('category.parent', 'parent')
            .orderBy('category.customOrder', 'ASC');
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            'category',
            entities.raw,
        );
        TreeRepositoryUtils.buildParentEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
        );
        return entity;
    }

    async countDescendants(entity: CategoryEntity): Promise<number> {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        return qb.getCount();
    }

    async countAncestors(entity: CategoryEntity) {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        return qb.getCount();
    }

    async toFlatTrees(
        trees: CategoryEntity[],
        depth = 0,
        parent: CategoryEntity | null = null,
    ): Promise<CategoryEntity[]> {
        const data: Omit<CategoryEntity, 'children'>[] = [];
        for (const item of trees) {
            item.depth = depth;
            item.parent = parent;
            const { children } = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1, item)));
        }
        return data as CategoryEntity[];
    }

    async flatAncestorsTree(item: CategoryEntity) {
        let data: Omit<CategoryEntity, 'children'>[] = [];
        const category = await this.findAncestorsTree(item);
        const { parent } = category;
        unset(category, 'children');
        unset(category, 'item');
        data.push(item);
        if (!isNil(parent)) {
            data = [...(await this.flatAncestorsTree(parent)), ...data];
        }
        return data as CategoryEntity[];
    }
}
