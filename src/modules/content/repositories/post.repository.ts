import { Repository } from 'typeorm';

import { PostEntity } from '@/modules/content/entities/post.entity';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('post');
    }
}
