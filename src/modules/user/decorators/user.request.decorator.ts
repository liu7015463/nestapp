import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserEntity } from '../entities/user.entity';

export const RequestUser = createParamDecorator(async (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as ClassToPlain<UserEntity>;
});
