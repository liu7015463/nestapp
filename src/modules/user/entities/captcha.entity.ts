import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { CaptchaActionType, CaptchaType } from '@/modules/user/constants';

@Entity('user_captcha')
export class CaptchaEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ comment: '验证码' })
    code!: string;

    @Column({
        type: 'enum',
        enum: CaptchaActionType,
        comment: '验证操作类型',
    })
    action!: CaptchaActionType;

    @Column({
        type: 'enum',
        enum: CaptchaType,
        comment: '验证码类型',
    })
    type!: CaptchaType;

    @Column({ comment: '手机号/邮箱地址' })
    value!: string;

    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        comment: '更新时间',
    })
    updatedAt!: Date;
}
