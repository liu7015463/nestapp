import { isNil, unset } from 'lodash';
import { FindOptionsUtils, FindTreeOptions, TreeRepositoryUtils } from 'typeorm';

import { CategoryEntity } from '@/modules/content/entities/category.entity';
import { BaseTreeRepository } from '@/modules/database/base/tree.repository';
import { OrderType, TreeChildrenResolve } from '@/modules/database/constants';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

@CustomRepository(CategoryEntity)
export class CategoryRepository extends BaseTreeRepository<CategoryEntity> {
    protected _qbName = 'category';

    protected orderBy = { name: 'customOrder', order: OrderType.ASC };

    protected _childrenResolve = TreeChildrenResolve.UP;

    buildBaseQB() {
        return this.createQueryBuilder('category').leftJoinAndSelect('category.parent', 'parent');
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
