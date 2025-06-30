import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';

import * as entities from '@/modules/content/entities';
import { ContentRbac } from '@/modules/content/rbac';
import * as repositories from '@/modules/content/repositories';
import * as services from '@/modules/content/services';
import { SearchService } from '@/modules/content/services';
import { SanitizeService } from '@/modules/content/services/SanitizeService';

import { PostService } from '@/modules/content/services/post.service';

import { DatabaseModule } from '@/modules/database/database.module';

import { addEntities, addSubscribers } from '@/modules/database/utils';

import { UserRepository } from '@/modules/user/repositories';

import { Configure } from '../config/configure';

import { defauleContentConfig } from './config';
import * as subscribers from './subscribers';
import { ContentConfig } from './types';

@Module({})
export class ContentModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        const config = await configure.get<ContentConfig>('content', defauleContentConfig);
        const providers: ModuleMetadata['providers'] = [
            ContentRbac,
            ...Object.values(services),
            ...(await addSubscribers(configure, Object.values(subscribers))),
            {
                provide: PostService,
                inject: [
                    repositories.PostRepository,
                    repositories.CategoryRepository,
                    repositories.TagRepository,
                    services.CategoryService,
                    UserRepository,
                    { token: services.SearchService, optional: true },
                ],
                useFactory(
                    postRepository: repositories.PostRepository,
                    categoryRepository: repositories.CategoryRepository,
                    tagRepository: repositories.TagRepository,
                    categoryService: services.CategoryService,
                    searchService: SearchService,
                    userRepository: UserRepository,
                ) {
                    return new PostService(
                        postRepository,
                        categoryRepository,
                        categoryService,
                        tagRepository,
                        userRepository,
                        searchService,
                        config.searchType,
                    );
                },
            },
        ];
        const exports: ModuleMetadata['exports'] = [
            ...Object.values(services),
            PostService,
            DatabaseModule.forRepository(Object.values(repositories)),
        ];
        if (config.searchType === 'meili') {
            providers.push(services.SearchService);
            exports.push(SearchService);
        }
        if (config.htmlEnabled) {
            providers.push(SanitizeService);
            exports.push(SanitizeService);
        }
        return {
            module: ContentModule,
            imports: [
                await addEntities(configure, Object.values(entities)),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
            providers,
            exports,
        };
    }
}
