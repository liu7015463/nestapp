import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('content_comment')
export class CommentEntity {
    @PrimaryColumn({ type: 'varchar', length: 36, generated: 'uuid' })
    id: string;

    @Column({ comment: '评论内容', type: 'text' })
    body: string;

    @CreateDateColumn({ comment: '创建时间' })
    createdAt: Date;
}
