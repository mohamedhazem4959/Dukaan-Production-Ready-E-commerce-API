import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

                transport:
                    process.env.NODE_ENV !== 'production'
                        ? {
                            target: 'pino-pretty',
                            options: {
                                singleLine: true,
                            },
                        }
                        : undefined,
            },
        }),
    ],
})
export class AppLoggerModule { }
