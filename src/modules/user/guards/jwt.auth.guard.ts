import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { isNil } from 'lodash';

import { ExtractJwt } from 'passport-jwt';

import { TokenService } from '@/modules/user/services/token.service';

import { ALLOW_GUEST } from '../constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        protected ref: Reflector,
        protected tokenService: TokenService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext) {
        const allowGuest = this.ref.getAllAndOverride<boolean>(ALLOW_GUEST, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (allowGuest) {
            return true;
        }
        const request = this.getRequest(context);

        const requestToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        if (isNil(requestToken)) {
            throw new UnauthorizedException();
        }

        const accessToken = await this.tokenService.checkAccessToken(requestToken);
        if (isNil(accessToken)) {
            throw new UnauthorizedException();
        }

        try {
            return (await super.canActivate(context)) as boolean;
        } catch {
            const response = this.getResponse(context);
            const token = await this.tokenService.refreshToken(accessToken, response);
            if (isNil(token)) {
                throw new UnauthorizedException();
            }
            if (token.accessToken) {
                request.headers.authorization = `Bearer ${token.accessToken.value}`;
            }
            return (await super.canActivate(context)) as boolean;
        }
    }

    /**
     * 自动请求处理
     * 如果请求中有错误则抛出错误
     * 如果请求中没有用户信息则抛出401异常
     * @param err
     * @param user
     * @param _info
     */
    handleRequest(err: any, user: any, _info: any) {
        if (err || isNil(user)) {
            if (isNil(user)) {
                throw new UnauthorizedException();
            }
            throw err;
        }
        return user;
    }

    getRequest(context: ExecutionContext) {
        return context.switchToHttp().getRequest();
    }

    getResponse(context: ExecutionContext) {
        return context.switchToHttp().getResponse();
    }
}
