import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';

import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: PinoLogger) { }

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // Skip logging for healthcheck endpoint
        if (request.originalUrl?.includes('/ping') || request.url?.includes('/ping')) {
            return next.handle();
        }

        const requestId = request.headers['x-request-id'] ?? randomUUID();
        response.setHeader('X-Request-ID', requestId);
        const start = Date.now();

        request.requestId = requestId;

        this.logger.info(
            {
                requestId,
                method: request.method,
                path: request.originalUrl,
            },
            'Request started',
        );

        return next.handle().pipe(
            tap(() => {
                this.logger.info(
                    {
                        requestId,
                        method: request.method,
                        path: request.originalUrl,
                        statusCode: response.statusCode,
                        duration: Date.now() - start,
                    },
                    'Request completed',
                );
            }),
            catchError((error) => {
                this.logger.error(
                    {
                        requestId,
                        method: request.method,
                        path: request.originalUrl,
                        statusCode: error.status ?? 500,
                        duration: Date.now() - start,
                        error: error.message,
                        stack: error.stack,
                    },
                    'Request failed',
                );
                return throwError(() => error);
            })
        );
    }
}