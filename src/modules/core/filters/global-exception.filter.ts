import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<FastifyRequest>();
        const response = ctx.getResponse<FastifyReply>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let details: any = null;

        // 记录完整的错误信息
        this.logError(exception, request);

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message =
                typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : (exceptionResponse as any).message || exception.message;
        } else if (exception instanceof QueryFailedError) {
            // 专门处理 TypeORM 查询错误
            status = HttpStatus.BAD_REQUEST;
            message = 'Database query failed';
            details = {
                query: exception.query,
                parameters: exception.parameters,
                driverError: exception.driverError?.message,
                sqlMessage: (exception as any).sqlMessage,
                code: (exception as any).code,
                errno: (exception as any).errno,
            };
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            ...(details && { details }),
        };

        response.status(status).send(errorResponse);
    }

    private logError(exception: unknown, request: FastifyRequest) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body,
            query: request.query,
            params: request.params,
        };

        if (exception instanceof QueryFailedError) {
            this.logger.error(`Database Query Failed: ${exception.message}`, {
                ...errorInfo,
                query: exception.query,
                parameters: exception.parameters,
                driverError: exception.driverError,
                stack: exception.stack,
                sqlMessage: (exception as any).sqlMessage,
                code: (exception as any).code,
                errno: (exception as any).errno,
            });
        } else if (exception instanceof Error) {
            this.logger.error(`Unhandled Exception: ${exception.message}`, {
                ...errorInfo,
                stack: exception.stack,
                name: exception.name,
            });
        } else {
            this.logger.error('Unknown Exception', {
                ...errorInfo,
                exception,
            });
        }
    }
}
