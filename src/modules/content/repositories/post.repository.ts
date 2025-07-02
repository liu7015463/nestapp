import { CommentEntity } from '@/modules/content/entities/comment.entity';
import { PostEntity } from '@/modules/content/entities/post.entity';
import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

@CustomRepository(PostEntity)
export class PostRepository extends BaseRepository<PostEntity> {
    protected _qbName = 'post';

    buildBaseQB() {
        return this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.category`, 'category')
            .leftJoinAndSelect(`${this.qbName}.tags`, 'tags')
            .leftJoinAndSelect(`${this.qbName}.author`, 'author')
            .addSelect((query) => {
                return query
                    .select('COUNT(c.id)', 'count')
                    .from(CommentEntity, 'c')
                    .where(`c.post.id = ${this.qbName}.id`);
            }, 'commentCount')
            .loadRelationCountAndMap(`${this.qbName}.commentCount`, `${this.qbName}.comments`);
    }
}
