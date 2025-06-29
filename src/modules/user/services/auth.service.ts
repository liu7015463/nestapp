import { ForbiddenException, Injectable } from '@nestjs/common';

import { FastifyRequest as Request } from 'fastify';

import { ExtractJwt } from 'passport-jwt';

import { Configure } from '@/modules/config/configure';

import { getTime } from '@/modules/core/helpers/time';
import { RegisterDto } from '@/modules/user/dtos/auth.dto';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { UserRepository } from '@/modules/user/repositories';
import { TokenService } from '@/modules/user/services/token.service';
import { decrypt } from '@/modules/user/utils';

import { UpdatePasswordDto } from '../dtos/account.dto';

import { UserService } from './user.service';

@Injectable()
export class AuthService {
    constructor(
        protected configure: Configure,
        protected userService: UserService,
        protected tokenService: TokenService,
        protected userRepository: UserRepository,
    ) {}

    /**
     * 用户登录验证
     * @param credential
     * @param password
     */
    async validateUser(credential: string, password: string) {
        const user = await this.userService.findOneByCredential(credential, async (query) =>
            query.addSelect('user.password'),
        );
        if (user && decrypt(password, user.password)) {
            return user;
        }
        return null;
    }

    /**
     * 登录用户,并生成新的accessToken和refreshToken
     * @param user
     */
    async login(user: UserEntity) {
        const now = await getTime(this.configure);
        const { accessToken } = await this.tokenService.generateAccessToken(user, now);
        return accessToken.value;
    }

    /**
     * 注销登录
     * @param req
     */
    async logout(req: Request) {
        const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);
        if (accessToken) {
            await this.tokenService.removeAccessToken(accessToken);
        }

        return { msg: 'logout_success' };
    }

    /**
     * 登录用户后生成新的token和refreshToken
     * @param id
     */
    async createToken(id: string) {
        const now = await getTime(this.configure);
        let user: UserEntity;
        try {
            user = await this.userService.detail(id);
        } catch (err) {
            throw new ForbiddenException(err);
        }
        const { accessToken } = await this.tokenService.generateAccessToken(user, now);
        return accessToken.value;
    }

    /**
     * 使用用户名密码注册用户
     * @param data
     */
    async register(data: RegisterDto) {
        const { username, nickname, password } = data;
        const user = await this.userService.create({
            username,
            nickname,
            password,
        } as any);
        return this.userService.findOneByCondition({ id: user.id });
    }

    /**
     * 更新用户密码
     * @param user
     * @param password
     * @param oldPassword
     */
    async changePassword(user: UserEntity, { password, oldPassword }: UpdatePasswordDto) {
        const item = await this.userRepository.findOneOrFail({
            select: ['password'],
            where: { id: user.id },
        });
        if (decrypt(oldPassword, item.password)) {
            await this.userRepository.save({ id: user.id, password }, { reload: true });
            return this.userService.detail(user.id);
        }
        throw new ForbiddenException('old password do not match');
    }
}
