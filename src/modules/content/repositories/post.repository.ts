import { Repository } from 'typeorm';

import { CommentEntity } from '@/modules/content/entities/comment.entity';
import { PostEntity } from '@/modules/content/entities/post.entity';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('post')
            .leftJoinAndSelect('post.category', 'category')
            .leftJoinAndSelect('post.tags', 'tags')
            .addSelect((query) => {
                return query
                    .select('COUNT(c.id)', 'count')
                    .from(CommentEntity, 'c')
                    .where('c.post.id = post.id');
            }, 'commentCount')
            .loadRelationCountAndMap('post.commentCOunt', 'post.comments');
    }
}
