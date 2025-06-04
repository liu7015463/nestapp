import { Injectable } from '@nestjs/common';
import { omit } from 'lodash';

import { CreateTagDto, UpdateTagDto } from '@/modules/content/dtos/tag.dto';
import { TagRepository } from '@/modules/content/repositories/tag.repository';
import { BaseService } from '@/modules/database/base/service';

import { TagEntity } from '../entities';

@Injectable()
export class TagService extends BaseService<TagEntity, TagRepository> {
    protected enableTrash = true;

    constructor(protected repository: TagRepository) {
        super(repository);
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
}
