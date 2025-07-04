import { BadGatewayException, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';

import { validateOrReject } from 'class-validator';

import { CredentialDto } from '../dtos/auth.dto';

/**
 * 用户登录守卫
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        try {
            await validateOrReject(plainToInstance(CredentialDto, request.body), {
                validationError: { target: false },
            });
        } catch (error) {
            const messages = (error as any[])
                .map((e) => e.constraints ?? {})
                .reduce((o, n) => ({ ...o, ...n }), {});
            throw new BadGatewayException(Object.values(messages));
        }
        return super.canActivate(context) as boolean;
    }
}
