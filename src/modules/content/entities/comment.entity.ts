import { Exclude, Expose, Type } from 'class-transformer';
import type { Relation } from 'typeorm';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from '@/modules/content/entities/post.entity';
import { UserEntity } from '@/modules/user/entities/user.entity';

@Exclude()
@Entity('content_comment')
@Tree('materialized-path')
export class CommentEntity extends BaseEntity {
    @Expose()
    @PrimaryColumn({ type: 'varchar', length: 36, generated: 'uuid' })
    id: string;

    @Expose()
    @Column({ comment: '评论内容', type: 'text' })
    body: string;

    @Expose()
    @CreateDateColumn({ comment: '创建时间' })
    @Type(() => Date)
    createdAt: Date;

    @Expose()
    @ManyToOne(() => PostEntity, (post) => post.comments, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    post: Relation<PostEntity>;

    @Expose({ groups: ['comment-list'] })
    depth = 0;

    @Expose({ groups: ['comment-detail', 'comment-list'] })
    @TreeParent({ onDelete: 'CASCADE' })
    parent: Relation<CommentEntity> | null;

    @Expose({ groups: ['comment-tree'] })
    @TreeChildren({ cascade: true })
    children: Relation<CommentEntity>[];

    @ManyToOne(() => UserEntity, (user) => user.comments, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    author: Relation<UserEntity>;
}
