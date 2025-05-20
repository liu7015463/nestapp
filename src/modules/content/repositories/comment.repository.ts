import { pick, unset } from 'lodash';
import {
    FindOptionsUtils,
    FindTreeOptions,
    SelectQueryBuilder,
    TreeRepository,
    TreeRepositoryUtils,
} from 'typeorm';

import { CommentEntity } from '@/modules/content/entities/comment.entity';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

type FindCommentTreeOptions = FindTreeOptions & {
    addQuery?: (query: SelectQueryBuilder<CommentEntity>) => SelectQueryBuilder<CommentEntity>;
};
@CustomRepository(CommentEntity)
export class CommentRepository extends TreeRepository<CommentEntity> {
    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity> {
        return qb
            .leftJoinAndSelect(`comment.parent`, 'parent')
            .leftJoinAndSelect(`comment.post`, `post`)
            .orderBy('comment.createdAt', 'DESC');
    }

    async findTrees(options: FindCommentTreeOptions): Promise<CommentEntity[]> {
        options.relations = ['parent', 'children'];
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    findRoots(options?: FindCommentTreeOptions): Promise<CommentEntity[]> {
        const { addQuery, ...rest } = options;
        const escape = (val: string) => this.manager.connection.driver.escape(val);
        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;

        let qb = this.buildBaseQB(this.createQueryBuilder('comment'));
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, rest);
        qb.where(`${escape('comment')}.${escape(parentPropertyName)} IS NULL`);
        qb = addQuery ? addQuery(qb) : qb;
        return qb.getMany();
    }

    createDtsQueryBuilder(
        closureTable: string,
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): SelectQueryBuilder<CommentEntity> {
        const { addQuery } = options;
        const qb = this.buildBaseQB(
            super.createDescendantsQueryBuilder('comment', closureTable, entity),
        );
        return addQuery ? addQuery(qb) : qb;
    }

    async findDescendantsTree(
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): Promise<CommentEntity> {
        const qb: SelectQueryBuilder<CommentEntity> = this.createDtsQueryBuilder(
            'treeClosure',
            entity,
            options,
        );
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            'comment',
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

    async toFlatTrees(trees: CommentEntity[], depth = 0): Promise<CommentEntity[]> {
        const data: Omit<CommentEntity, 'children'>[] = [];
        for (const item of trees) {
            item.depth = depth;
            const { children } = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1)));
        }
        return data as CommentEntity[];
    }
}
