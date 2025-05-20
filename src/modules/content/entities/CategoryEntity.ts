import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('content_category')
export class CategoryEntity {
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Column({ comment: '分类名称', unique: true })
    name: string;

    @Column({ comment: '分类排序', default: 0 })
    customOrder: number;
}
