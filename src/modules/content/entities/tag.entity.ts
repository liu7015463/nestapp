import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('content_tag')
export class TagEntity {
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Column({ comment: '标签名称', unique: true })
    name: string;

    @Column({ comment: '标签描述', nullable: true })
    desc?: string;
}
