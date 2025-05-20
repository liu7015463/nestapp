import { Expose } from 'class-transformer';
import { Column, Entity, ManyToMany, PrimaryColumn, Relation } from 'typeorm';

import { PostEntity } from '@/modules/content/entities/post.entity';

@Entity('content_tag')
export class TagEntity {
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Column({ comment: '标签名称', unique: true })
    name: string;

    @Column({ comment: '标签描述', nullable: true })
    desc?: string;

    @Expose()
    @ManyToMany(() => PostEntity, (post) => post.tags)
    posts: Relation<PostEntity[]>;
}
