import { Injectable } from '@nestjs/common';
import { omit } from 'lodash';

import { CreateTagDto, QueryTagDto, UpdateTagDto } from '@/modules/content/dtos/tag.dto';
import { TagRepository } from '@/modules/content/repositories/tag.repository';
import { paginate } from '@/modules/database/utils';

@Injectable()
export class TagService {
    constructor(protected repository: TagRepository) {}

    async paginate(options: QueryTagDto) {
        const qb = this.repository.buildBaseQB();
        return paginate(qb, options);
    }

    async detail(id: string) {
        const qb = this.repository.buildBaseQB();
        qb.where(`tag.id = :id`, { id });
        return qb.getOneOrFail();
    }

    async create(data: CreateTagDto) {
        const item = await this.repository.save(data);
        return this.detail(item.id);
    }

    async update(data: UpdateTagDto) {
        await this.repository.update(data.id, omit(data, ['id']));
        return this.detail(data.id);
    }

    async delete(id: string) {
        const item = await this.repository.findOneByOrFail({ id });
        return this.repository.remove(item);
    }
}
