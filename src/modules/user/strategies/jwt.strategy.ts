import { PassportStrategy } from '@nestjs/passport';

import { instanceToPlain } from 'class-transformer';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Configure } from '@/modules/config/configure';

import { TokenConst } from '../constants';
import { UserRepository } from '../repositories/UserRepository';
import { JwtPayload } from '../types';

export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        protected configure: Configure,
        protected userRepository: UserRepository,
    ) {
        const secret = configure.env.get(
            TokenConst.USER_TOKEN_SECRET,
            TokenConst.DEFAULT_USER_TOKEN_SECRET,
        );
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    /**
     * 通过荷载解析出用户ID
     * 通过用户ID查询出用户是否存在,并把id放入request方便后续操作
     * @param payload
     */
    async validate(payload: JwtPayload) {
        const user = await this.userRepository.findOneOrFail({ where: { id: payload.sub } });
        return instanceToPlain(user);
    }
}
