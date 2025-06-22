import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { isNil } from 'lodash';
import { Observable } from 'rxjs';

export class UserInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const request: any = context.switchToHttp().getRequest();
        if (!isNil(request.user?.id)) {
            if (isNil(request.body)) {
                request.body = { userId: request.user.id };
            } else {
                request.body.userId = request.user.id;
            }
        }
        return next.handle();
    }
}
