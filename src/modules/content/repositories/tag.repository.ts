import { PostEntity } from '@/modules/content/entities/post.entity';
import { TagEntity } from '@/modules/content/entities/tag.entity';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { BaseRepository } from '../../database/base/repository';

@CustomRepository(TagEntity)
export class TagRepository extends BaseRepository<TagEntity> {
    protected _qbName = 'tag';

    buildBaseQB() {
        return this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.posts`, 'posts')
            .addSelect(
                (query) => query.select('COUNT(p.id)', 'count').from(PostEntity, 'p'),
                'postCount',
            )
            .orderBy('postCount', 'DESC')
            .loadRelationCountAndMap(`${this.qbName}.postCount`, `${this.qbName}.posts`);
    }
}
