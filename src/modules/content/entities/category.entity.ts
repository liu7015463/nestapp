import { Exclude, Expose, Type } from 'class-transformer';
import type { Relation } from 'typeorm';
import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from '@/modules/content/entities/post.entity';

@Exclude()
@Entity('content_category')
@Tree('materialized-path')
export class CategoryEntity extends BaseEntity {
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({ comment: '分类名称' })
    name: string;

    @Expose({ groups: ['category-tree', 'category-list', 'category-detail'] })
    @Column({ comment: '分类排序', default: 0 })
    customOrder: number;

    @OneToMany(() => PostEntity, (post) => post.category, { cascade: true })
    posts: Relation<PostEntity>[];

    @Expose({ groups: ['category-list'] })
    depth = 0;

    @Expose({ groups: ['category-detail', 'category-list'] })
    @TreeParent({ onDelete: 'NO ACTION' })
    parent: Relation<CategoryEntity> | null;

    @Type(() => CategoryEntity)
    @Expose({ groups: ['category-tree', 'category-detail'] })
    @TreeChildren({ cascade: true })
    children: Relation<CategoryEntity>[];
}
