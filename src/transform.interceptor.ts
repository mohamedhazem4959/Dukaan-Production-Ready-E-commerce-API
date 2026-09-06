import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';
import { Response as responseType } from 'express';

export interface Response<T> {
    success: boolean;
    statusCode: number;
    data?: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        const response = context.switchToHttp().getResponse<responseType>();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map(data => ({
                success: statusCode >= 200 && statusCode < 300,
                statusCode,
                data
            }))
        )
    }
}