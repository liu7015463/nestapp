import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryColumn,
    Relation,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from '@/modules/content/entities/post.entity';

@Entity('content_category')
@Tree('materialized-path')
export class CategoryEntity extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Column({ comment: '分类名称', unique: true })
    name: string;

    @Column({ comment: '分类排序', default: 0 })
    customOrder: number;

    @OneToMany(() => PostEntity, (post) => post.category, { cascade: true })
    posts: Relation<PostEntity>[];

    depth = 0;

    @TreeParent({ onDelete: 'NO ACTION' })
    parent: Relation<CategoryEntity> | null;

    @TreeChildren({ cascade: true })
    children: Relation<CategoryEntity>[];
}
