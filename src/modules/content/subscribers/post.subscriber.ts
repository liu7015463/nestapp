import { Optional } from '@nestjs/common';
import { isNil } from 'lodash';
import { DataSource, EventSubscriber, ObjectType } from 'typeorm';

import { Configure } from '@/modules/config/configure';
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
        protected postRepository: PostRepository,
        protected configure: Configure,
        @Optional() protected sanitizeService: SanitizeService,
    ) {
        super(dataSource);
    }

    async afterLoad(entity: PostEntity) {
        if (
            (await this.configure.get('content.htmlEnabled')) &&
            !isNil(this.sanitizeService) &&
            entity.type === PostBodyType.HTML
        ) {
            entity.body = this.sanitizeService.sanitize(entity.body);
        }
    }
}
