import { isNil } from 'lodash';
import { DataSource, EventSubscriber, ObjectType } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { PostBodyType } from '@/modules/content/constants';
import { PostEntity } from '@/modules/content/entities/post.entity';
import { SanitizeService } from '@/modules/content/services/SanitizeService';
import { BaseSubscriber } from '@/modules/database/base/subscriber';

@EventSubscriber()
export class PostSubscriber extends BaseSubscriber<PostEntity> {
    protected entity: ObjectType<PostEntity> = PostEntity;

    constructor(
        protected dataSource: DataSource,
        protected _configure: Configure,
    ) {
        super(dataSource, _configure);
    }

    get configure(): Configure {
        return this._configure;
    }

    async afterLoad(entity: PostEntity) {
        const sanitizeService = (await this.configure.get('content.htmlEnabled'))
            ? this.container.get(SanitizeService)
            : undefined;
        if (!isNil(sanitizeService) && entity.type === PostBodyType.HTML) {
            entity.body = sanitizeService.sanitize(entity.body);
        }
    }
}
