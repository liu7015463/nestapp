import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryColumn,
    Relation,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from '@/modules/content/entities/post.entity';

@Entity('content_comment')
@Tree('materialized-path')
export class CommentEntity extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', length: 36, generated: 'uuid' })
    id: string;

    @Column({ comment: '评论内容', type: 'text' })
    body: string;

    @CreateDateColumn({ comment: '创建时间' })
    createdAt: Date;

    @ManyToOne(() => PostEntity, (post) => post.comments, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    post: Relation<PostEntity>;

    depth = 0;

    @TreeParent({ onDelete: 'CASCADE' })
    parent: Relation<CommentEntity> | null;

    @TreeChildren({ cascade: true })
    children: Relation<CommentEntity>[];
}
