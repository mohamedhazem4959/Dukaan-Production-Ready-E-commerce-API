import { Global, Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { AuthGuard } from './guard/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './guard/role.guard';
import { RedisService } from './services/redis.service';
import { AppLoggerModule } from './logger/logger.module';


@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '15m' },
            }),
        }),
        AppLoggerModule,
    ],
    providers: [HashingService, AuthGuard, RolesGuard, RedisService],
    exports: [HashingService, AuthGuard, JwtModule, RolesGuard, RedisService]
})
export class CommonModule { }

