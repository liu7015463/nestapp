import { FindOptionsUtils, FindTreeOptions, SelectQueryBuilder } from 'typeorm';

import { CommentEntity } from '@/modules/content/entities/comment.entity';
import { BaseTreeRepository } from '@/modules/database/base/tree.repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';
import { QueryHook } from '@/modules/database/types';

type FindCommentTreeOptions = FindTreeOptions & {
    addQuery?: QueryHook<CommentEntity>;
};

@CustomRepository(CommentEntity)
export class CommentRepository extends BaseTreeRepository<CommentEntity> {
    protected _qbName = 'comment';

    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity> {
        return qb
            .leftJoinAndSelect(`comment.parent`, 'parent')
            .leftJoinAndSelect(`comment.post`, `post`)
            .orderBy('comment.createdAt', 'DESC');
    }

    async findRoots(options?: FindCommentTreeOptions): Promise<CommentEntity[]> {
        const { addQuery, ...rest } = options;
        const escape = (val: string) => this.manager.connection.driver.escape(val);
        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;

        let qb = this.buildBaseQB(this.createQueryBuilder('comment'));
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, rest);
        qb.where(`${escape('comment')}.${escape(parentPropertyName)} IS NULL`);
        qb = addQuery ? await addQuery(qb) : qb;
        return qb.getMany();
    }

    async createDtsQueryBuilder(
        closureTable: string,
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): Promise<SelectQueryBuilder<CommentEntity>> {
        const { addQuery } = options;
        const qb = this.buildBaseQB(
            super.createDescendantsQueryBuilder('comment', closureTable, entity),
        );
        return addQuery ? addQuery(qb) : qb;
    }
}
