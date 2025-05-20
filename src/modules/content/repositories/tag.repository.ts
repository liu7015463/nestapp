import { Repository } from 'typeorm';

import { PostEntity } from '@/modules/content/entities/post.entity';
import { TagEntity } from '@/modules/content/entities/tag.entity';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

@CustomRepository(TagEntity)
export class TagRepository extends Repository<TagEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('tag')
            .leftJoinAndSelect('tag.posts', 'posts')
            .addSelect(
                (query) => query.select('COUNT(p.id)', 'count').from(PostEntity, 'p'),
                'postCount',
            )
            .orderBy('postCount', 'DESC')
            .loadRelationCountAndMap('tag.postCount', 'tag.posts');
    }
}
