import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { isNil, omit } from 'lodash';
import { MeiliSearch } from 'meilisearch';

import { PostEntity } from '@/modules/content/entities';
import {
    CategoryRepository,
    CommentRepository,
    PostRepository,
} from '@/modules/content/repositories';
import { SearchOption } from '@/modules/content/types';
import { getSearchData, getSearchItem } from '@/modules/content/utils';
import { SelectTrashMode } from '@/modules/database/constants';
import { MeiliService } from '@/modules/meilisearch/meili.service';

@Injectable()
export class SearchService implements OnModuleInit {
    private index = 'content';

    protected client: MeiliSearch;

    constructor(
        protected meiliService: MeiliService,
        protected categoryRepository: CategoryRepository,
        protected commentRepository: CommentRepository,
        protected postRepository: PostRepository,
    ) {
        this.client = this.meiliService.getClient();
    }

    async onModuleInit(): Promise<any> {
        await this.client.deleteIndex(this.index);
        this.client.index(this.index).updateFilterableAttributes(['deletedAt', 'publishedAt']);
        this.client.index(this.index).updateSortableAttributes(['updatedAt', 'commentCount']);
        const posts = await this.postRepository.buildBaseQB().withDeleted().getMany();
        await this.client
            .index(this.index)
            .addDocuments(
                await getSearchData(posts, this.categoryRepository, this.commentRepository),
            );
    }

    getClient() {
        if (isNil(this.client)) {
            throw new ForbiddenException('Has no meili search client!');
        }
        return this.client;
    }

    async search(text: string, param: SearchOption = {}): Promise<any> {
        const option = { page: 1, limit: 10, trashed: SelectTrashMode.NONE, ...param };
        const limit = isNil(option.limit) || option.limit < 1 ? 1 : option.limit;
        const page = isNil(option.page) || option.page < 1 ? 1 : option.page;
        let filter = ['deletedAt IS NULL'];
        if (option.trashed === SelectTrashMode.ALL) {
            filter = [];
        } else if (option.trashed === SelectTrashMode.ONLY) {
            filter = ['deletedAt IS NOT NULL'];
        }
        if (option.isPublished) {
            filter.push('publishedAt IS NOT NULL');
        }
        const result = await this.client
            .index(this.index)
            .search(text, { page, limit, sort: ['updatedAt:desc', 'commentCount:desc'], filter });
        return {
            items: result.hits,
            currentPage: result.page,
            perPage: result.hitsPerPage,
            totalItems: result.estimatedTotalHits,
            itemCount: result.totalHits,
            ...omit(result, ['hits', 'page', 'hitsPerPage', 'estimatedTotalHits', 'totalHits']),
        };
    }

    async create(post: PostEntity) {
        return this.getClient()
            .index(this.index)
            .addDocuments(
                await getSearchItem(this.categoryRepository, this.commentRepository, post),
            );
    }

    async update(posts: PostEntity[]) {
        return this.getClient()
            .index(this.index)
            .updateDocuments(
                await getSearchData(posts, this.categoryRepository, this.commentRepository),
            );
    }

    async delete(ids: string[]) {
        return this.getClient().index(this.index).deleteDocuments(ids);
    }
}
