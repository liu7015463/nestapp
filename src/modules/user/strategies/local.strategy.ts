import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '@/modules/user/services';

/**
 * 用户认证本地策略
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(protected authService: AuthService) {
        super({ usernameField: 'credential', passwordField: 'password' });
    }

    async validate(credential: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(credential, password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
