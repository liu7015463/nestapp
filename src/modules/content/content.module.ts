import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import * as controllers from '@/modules/content/controllers';
import * as entities from '@/modules/content/entities';
import * as repositories from '@/modules/content/repositories';
import * as services from '@/modules/content/services';
import { SearchService } from '@/modules/content/services';
import { SanitizeService } from '@/modules/content/services/SanitizeService';

import { PostService } from '@/modules/content/services/post.service';
import { PostSubscriber } from '@/modules/content/subscribers/post.subscriber';
import { DatabaseModule } from '@/modules/database/database.module';

import { Configure } from '../config/configure';

import { defauleContentConfig } from './config';
import { ContentConfig } from './types';

@Module({})
export class ContentModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        const config = await configure.get<ContentConfig>('content', defauleContentConfig);
        const providers: ModuleMetadata['providers'] = [
            ...Object.values(services),
            PostSubscriber,
            {
                provide: PostService,
                inject: [
                    repositories.PostRepository,
                    repositories.CategoryRepository,
                    repositories.TagRepository,
                    services.CategoryService,
                    { token: services.SearchService, optional: true },
                ],
                useFactory(
                    postRepository: repositories.PostRepository,
                    categoryRepository: repositories.CategoryRepository,
                    tagRepository: repositories.TagRepository,
                    categoryService: services.CategoryService,
                    searchService: SearchService,
                ) {
                    return new PostService(
                        postRepository,
                        categoryRepository,
                        categoryService,
                        tagRepository,
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
                TypeOrmModule.forFeature(Object.values(entities)),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
            controllers: Object.values(controllers),
            providers,
            exports,
        };
    }
}
