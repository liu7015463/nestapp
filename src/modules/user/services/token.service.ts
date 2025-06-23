/* eslint-disable import/no-extraneous-dependencies */
import { Injectable } from '@nestjs/common';

import { JwtModule, JwtModuleOptions, JwtService } from '@nestjs/jwt';

import dayjs from 'dayjs';
import { FastifyReply as Response } from 'fastify';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import { Configure } from '@/modules/config/configure';
import { getTime } from '@/modules/core/helpers/time';
import { defaultUserConfig, getUserConfig } from '@/modules/user/config';
import { AccessTokenEntity } from '@/modules/user/entities/access.token.entity';
import { RefreshTokenEntity } from '@/modules/user/entities/refresh.token.entity';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { JwtConfig, JwtPayload, UserConfig } from '@/modules/user/types';

import { TokenConst } from '../constants';

/**
 * 令牌服务
 */
@Injectable()
export class TokenService {
    constructor(
        protected configure: Configure,
        protected jwtService: JwtService,
    ) {}

    /**
     * 根据accessToken刷新AccessToken与RefreshToken
     * @param accessToken
     * @param response
     */
    async refreshToken(accessToken: AccessTokenEntity, response: Response) {
        const { user, refreshToken } = accessToken;
        if (refreshToken) {
            const now = await getTime(this.configure);
            if (now.isAfter(refreshToken.expiredAt)) {
                return null;
            }
            const token = await this.generateAccessToken(user, now);
            await accessToken.remove();
            response.header('token', token.accessToken.value);
            return token;
        }
        return null;
    }

    /**
     * 根据荷载签出新的AccessToken并存入数据库
     * 且自动生成新的Refresh也存入数据库
     * @param user
     * @param now
     */
    async generateAccessToken(
        user: UserEntity,
        now: dayjs.Dayjs,
    ): Promise<{ accessToken: AccessTokenEntity; refreshToken: RefreshTokenEntity }> {
        const config = await getUserConfig<JwtConfig>(this.configure, 'jwt');
        const accessTokenPayload: JwtPayload = { sub: user.id, iat: now.unix() };
        const signed = this.jwtService.sign(accessTokenPayload);
        const accessToken = new AccessTokenEntity();
        accessToken.value = signed;
        accessToken.user = user;
        accessToken.expiredAt = now.add(config.tokenExpired, 'second').toDate();
        await accessToken.save();
        const refreshToken = await this.generateRefreshToken(
            accessToken,
            await getTime(this.configure),
        );
        return { accessToken, refreshToken };
    }

    /**
     * 生成新的RefreshToken并存入数据库
     * @param accessToken
     * @param now
     */
    async generateRefreshToken(
        accessToken: AccessTokenEntity,
        now: dayjs.Dayjs,
    ): Promise<RefreshTokenEntity> {
        const config = await getUserConfig<JwtConfig>(this.configure, 'jwt');
        const refreshTokenPayload = { uuid: uuid() };
        const refreshToken = new RefreshTokenEntity();
        refreshToken.value = jwt.sign(
            refreshTokenPayload,
            this.configure.env.get(
                TokenConst.USER_REFRESH_TOKEN_EXPIRED,
                TokenConst.DEFAULT_USER_REFRESH_TOKEN_EXPIRED,
            ),
        );
        refreshToken.expiredAt = now.add(config.refreshTokenExpired, 'second').toDate();
        refreshToken.accessToken = accessToken;
        await refreshToken.save();
        return refreshToken;
    }

    /**
     * 检查accessToken是否存在
     * @param value
     */
    async checkAccessToken(value: string) {
        return AccessTokenEntity.findOne({ where: { value }, relations: ['user', 'refreshToken'] });
    }

    /**
     * 移除AccessToken且自动移除关联的RefreshToken
     * @param value
     */
    async removeAccessToken(value: string) {
        const accessToken = await AccessTokenEntity.findOne({ where: { value } });
        if (accessToken) {
            await accessToken.remove();
        }
    }

    /**
     * 移除RefreshToken
     * @param value
     */
    async removeRefreshToken(value: string) {
        const refreshToken = await RefreshTokenEntity.findOne({
            where: { value },
            relations: ['accessToken'],
        });
        if (refreshToken) {
            if (refreshToken.accessToken) {
                await refreshToken.accessToken.remove();
            }
            await refreshToken.remove();
        }
    }

    /**
     * 验证Token是否正确,如果正确则返回所属用户对象
     * @param token
     */
    async verifyAccessToken(token: AccessTokenEntity) {
        const result = jwt.verify(
            token.value,
            this.configure.env.get(
                TokenConst.USER_TOKEN_SECRET,
                TokenConst.DEFAULT_USER_TOKEN_SECRET,
            ),
        );
        if (result) {
            return token.user;
        }
        return null;
    }

    static JwtModuleFactory(configure: Configure) {
        return JwtModule.registerAsync({
            useFactory: async (): Promise<JwtModuleOptions> => {
                const config = await configure.get<UserConfig>(
                    'user',
                    defaultUserConfig(configure),
                );
                const options: JwtModuleOptions = {
                    secret: configure.env.get(
                        TokenConst.USER_TOKEN_SECRET,
                        TokenConst.DEFAULT_USER_TOKEN_SECRET,
                    ),
                    verifyOptions: {
                        ignoreExpiration: !configure.env.isProd(),
                    },
                };
                if (configure.env.isProd()) {
                    options.signOptions = { expiresIn: `${config.jwt.tokenExpired}s` };
                }
                return options;
            },
        });
    }
}
