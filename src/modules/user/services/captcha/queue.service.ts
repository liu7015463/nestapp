import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { instanceToPlain } from 'class-transformer';
import { isNil } from 'lodash';
import { Repository } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { getTime } from '@/modules/core/helpers/time';

import { getUserConfig } from '../../config';
import {
    CaptchaActionType,
    CaptchaType,
    EMAIL_CAPTCHA_JOB,
    PHONE_CAPTCHA_JOB,
    SEND_CAPTCHA_QUEUE,
} from '../../constants';
import {
    CredentialCaptchaMessageDto,
    EmailCaptchaMessageDto,
    PhoneCaptchaMessageDto,
} from '../../dtos/captcha.dto';
import { UserEntity } from '../../entities';
import { CaptchaEntity } from '../../entities/captcha.entity';
import { CaptchaOption } from '../../types';
import { generateCaptchaCode } from '../../utils';
import { UserService } from '../user.service';

import { CaptchaWorkerService } from './work.service';

interface CommonSendParams {
    action: CaptchaActionType;
    type: CaptchaType;
    message?: string;
}
interface SendParams extends CommonSendParams {
    data: PhoneCaptchaMessageDto | EmailCaptchaMessageDto;
    code?: string;
}
interface UserSendParams extends Omit<CommonSendParams, 'type'> {
    user: UserEntity;
    type?: CaptchaType;
}

interface CredentialSendParams extends Omit<CommonSendParams, 'type'> {
    credential: CredentialCaptchaMessageDto['credential'];
    type?: CaptchaType;
}

interface TypeSendParams extends CommonSendParams {
    data: PhoneCaptchaMessageDto | EmailCaptchaMessageDto;
}

/**
 * 验证码发送服务
 */
@Injectable()
export class CaptchaQueueService {
    constructor(
        @InjectRepository(CaptchaEntity)
        protected captchaRepository: Repository<CaptchaEntity>,
        @InjectQueue(SEND_CAPTCHA_QUEUE) protected captchaQueue: Queue,
        protected userService: UserService,
        protected workerService: CaptchaWorkerService,
        private configure: Configure,
    ) {
        this.workerService.addWorker();
    }

    /**
     * 根据消息类型(短信/邮件)添加发送任务
     * @param params
     */
    async sendByType(params: TypeSendParams) {
        const { data, action, type, message } = params;
        const key = type === CaptchaType.PHONE ? 'phone' : 'email';
        const conditional = { [key]: (data as any)[key] };
        const user = await this.userService.findOneByCondition(conditional);
        if (!user) {
            throw new BadRequestException(
                `user with ${key === 'phone' ? 'phone number' : 'email'} ${
                    (data as any)[key]
                } not exists`,
            );
        }
        return this.sendByUser({
            user,
            action,
            type,
            message,
        });
    }

    /**
     * 通过登录凭证添加发送任务
     * @param params
     */
    async sendByCredential(params: CredentialSendParams) {
        const { credential, ...others } = params;
        const user = await this.userService.findOneByCredential(credential);
        if (!user) {
            throw new BadRequestException(`user ${credential} not exists`);
        }
        return this.sendByUser({ user, ...others });
    }

    /**
     * 通过用户对象发送验证码
     * @param params
     */
    async sendByUser(params: UserSendParams) {
        const { user, action, type, message } = params;
        // 创建发送类型列表
        const types: CaptchaType[] = type ? [type] : [CaptchaType.PHONE, CaptchaType.EMAIL];
        // 添加异步任务返回的结果
        const logs: Record<string, any> = {};
        // 运行结果
        const results: Record<string, boolean> = {};
        // 错误消息
        let error = message;
        if (!error) {
            if (types.length > 1) error = 'can not send phone sms or email for you!';
            else error = `can not send ${types[0]} for you!`;
        }
        // 生成随机验证码
        const code = generateCaptchaCode();
        // 遍历发送类型列表
        for (const stype of types) {
            const key = stype === CaptchaType.PHONE ? 'phone' : 'email';
            // 发送验证码
            if (user[key]) {
                try {
                    const data = { [key]: user[key] } as {
                        [key in 'phone' | 'email']: string;
                    };
                    // 添加发送任务
                    const { result, log } = await this.send({
                        data,
                        action,
                        type: stype,
                        code,
                    });
                    results[key] = result;
                    logs[key] = log;
                } catch (err) {
                    throw new BadRequestException(err);
                }
            }
        }
        return results;
    }

    /**
     * 添加验证码发送任务
     * @param params
     */
    async send(params: SendParams): Promise<{ result: boolean; log: any }> {
        const { data, action, type, message, code } = params;
        let log: any;
        const result = true;
        const captchaCode = code ?? generateCaptchaCode();
        const error =
            message ?? `send ${type === CaptchaType.PHONE ? 'phone' : 'email'} captcha failed`;
        try {
            // 获取验证码发送配置
            const config = await getUserConfig<CaptchaOption | undefined>(
                this.configure,
                `captcha.${type}.${action}`,
            );
            if (isNil(config)) {
                throw new BadRequestException(error);
            }
            // 创建验证码模型实例
            const captcha = await this.createCaptcha(data, action, type, config, captchaCode);
            const { expired } = config;
            const otherVars: RecordAny =
                action === CaptchaActionType.LOGIN ? { expired: Math.floor(expired / 60) } : {};
            otherVars.code = captchaCode;
            const jobName = type === CaptchaType.EMAIL ? EMAIL_CAPTCHA_JOB : PHONE_CAPTCHA_JOB;
            // 加入异步发送任务
            await this.captchaQueue.add(jobName, {
                captcha: instanceToPlain(captcha),
                option: { ...config },
                otherVars,
            });
        } catch (err) {
            console.error(err);
            throw new BadRequestException(err);
        }
        return { result, log };
    }

    /**
     * 创建验证码模型对象
     * @param data
     * @param action
     * @param type
     * @param config
     * @param code
     */
    protected async createCaptcha(
        data: PhoneCaptchaMessageDto | EmailCaptchaMessageDto,
        action: CaptchaActionType,
        type: CaptchaType,
        config: CaptchaOption,
        code?: string,
    ) {
        const value =
            type === CaptchaType.PHONE
                ? (data as PhoneCaptchaMessageDto).phone
                : (data as EmailCaptchaMessageDto).email;
        // 查询验证码是否存在
        const captcha = await this.captchaRepository.findOne({ where: { value, type, action } });
        // 如果没有传入code参数,则生成一个随机验证码
        const captchaCode = code ?? generateCaptchaCode();
        // 如果不存在则创建一个新的模型对象并返回
        if (isNil(captcha)) {
            return this.captchaRepository.create({
                value,
                type,
                action,
                code: captchaCode,
            });
        }
        // 发送频率限制
        const now = await getTime(this.configure);
        // 判断是否超过发送频率
        const canSend = now.isAfter(
            (await getTime(this.configure, { date: captcha.updatedAt })).add(
                config.limit,
                'second',
            ),
        );
        if (!canSend) {
            throw new Error(`Can't repeat send in ${config.limit}s `);
        }
        // 改变当前模型对象的code字段为新的验证码
        captcha.code = captchaCode;
        return captcha;
    }
}
