import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import * as controllers from '@/modules/content/controllers';
import * as entities from '@/modules/content/entities';
import * as repositories from '@/modules/content/repositories';
import * as services from '@/modules/content/services';
import { SanitizeService } from '@/modules/content/services/SanitizeService';

import { PostService } from '@/modules/content/services/post.service';
import { PostSubscriber } from '@/modules/content/subscribers/post.subscriber';
import { ContentConfig } from '@/modules/content/types';
import { DatabaseModule } from '@/modules/database/database.module';

@Module({})
export class ContentModule {
    static forRoot(configRegister?: () => ContentConfig): DynamicModule {
        const config: Required<ContentConfig> = {
            SearchType: 'mysql',
            ...(configRegister ? configRegister() : {}),
        };
        const providers: ModuleMetadata['providers'] = [
            ...Object.values(services),
            SanitizeService,
            PostSubscriber,
            {
                provide: PostService,
                inject: [
                    repositories.PostRepository,
                    repositories.CategoryRepository,
                    repositories.TagRepository,
                    services.CategoryService,
                ],
                useFactory(
                    postRepository: repositories.PostRepository,
                    categoryRepository: repositories.CategoryRepository,
                    tagRepository: repositories.TagRepository,
                    categoryService: services.CategoryService,
                ) {
                    return new PostService(
                        postRepository,
                        categoryRepository,
                        categoryService,
                        tagRepository,
                        config.SearchType,
                    );
                },
            },
        ];
        return {
            module: ContentModule,
            imports: [
                TypeOrmModule.forFeature(Object.values(entities)),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
            controllers: Object.values(controllers),
            providers,
            exports: [
                ...Object.values(services),
                PostService,
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
        };
    }
}
