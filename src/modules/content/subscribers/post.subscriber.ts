import { DataSource, EventSubscriber, ObjectType } from 'typeorm';

import { PostBodyType } from '@/modules/content/constants';
import { PostEntity } from '@/modules/content/entities/post.entity';
import { PostRepository } from '@/modules/content/repositories/post.repository';
import { SanitizeService } from '@/modules/content/services/SanitizeService';
import { BaseSubscriber } from '@/modules/database/base/subscriber';

@EventSubscriber()
export class PostSubscriber extends BaseSubscriber<PostEntity> {
    protected entity: ObjectType<PostEntity> = PostEntity;
    constructor(
        protected dataSource: DataSource,
        protected sanitizeService: SanitizeService,
        protected postRepository: PostRepository,
    ) {
        super(dataSource);
    }

    async afterLoad(entity: PostEntity) {
        if (entity.type === PostBodyType.HTML) {
            entity.body = this.sanitizeService.sanitize(entity.body);
        }
    }
}
