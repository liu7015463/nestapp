import { DataSource, EventSubscriber } from 'typeorm';

import { PostBodyType } from '@/modules/content/constants';
import { PostEntity } from '@/modules/content/entities/post.entity';
import { PostRepository } from '@/modules/content/repositories/post.repository';
import { SanitizeService } from '@/modules/content/services/SanitizeService';

@EventSubscriber()
export class PostSubscriber {
    constructor(
        protected dataSource: DataSource,
        protected sanitizeService: SanitizeService,
        protected postRepository: PostRepository,
    ) {
        dataSource.subscribers.push(this);
    }
    listenTo() {
        return PostEntity;
    }

    async afterLoad(entity: PostEntity) {
        if (entity.type === PostBodyType.HTML) {
            entity.body = this.sanitizeService.sanitize(entity.body);
        }
    }
}
