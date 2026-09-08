import { ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { AccessToken } from './interfaces/access-token.interface';
import crypto from 'crypto'
import { TempUser } from './interfaces/temp-user.interface';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { HashingService } from 'src/common/services/hashing.service';
import { RedisService } from 'src/common/services/redis.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly hashService: HashingService,
        private readonly jwt: JwtService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        private readonly redisService: RedisService

    ) { }

    async signUp(createUser: CreateUserDto) {
        const { confirm_password: _, ...result } = createUser;
        const hashPassword = await this.hashService.hash(result.password)

        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUser.email }
        })
        if (existingUser) throw new UnauthorizedException(`Invalide Credintials`);

        const tempUserPayload: TempUser = {
            username: result.username,
            email: result.email,
            password_hash: hashPassword,
            birth_date: result.birth_date,
            phone_number: result.phone_number
        }

        const tempUserStr = JSON.stringify(tempUserPayload)

        try {
            const cacheKey = `tempUser:${result.email}`;

            const store = await this.redisService.setex(cacheKey, tempUserStr, 15 * 60);

            console.log(`stored the data in redis: ${store}, cacheKey: ${cacheKey}`);
            return this.mailService.sendVerifyEmail(result.email, result.username, `${this.configService.get<string>('VERIFY_URL')!}?email=${result.email}`)
        } catch (error) {
            throw new Error(`${error}`)
        }
    }

    async signIn(loginUser: LoginUserDto) {
        //find user using email
        const user = await this.prisma.user.findUnique({
            where: {
                email: loginUser.email
            }
        })

        if (!user || user.passwordHash === null) throw new NotFoundException(`Invalid Credintials`);

        //compare password
        const checkPassword = await this.hashService.compare(loginUser.password, user.passwordHash);
        if (!checkPassword) throw new UnauthorizedException(`Invalid Credintials`);


        //generate access token
        const sessionId = crypto.randomUUID();
        const payload: AccessToken = { sub: user.id, username: user.username, email: user.email, role: user.role, birthDate: user.birthDate, phoneNumber: user.phoneNumber }

        const token = this.jwt.sign(payload);
        const refreshToken = crypto.randomBytes(40).toString('hex');

        //hash refresh token
        const hashedRefreshToken = await this.hashService.hash(refreshToken);

        const sessionData = JSON.stringify({ userId: user.id, hashedToken: hashedRefreshToken, username: user.username, email: user.email, role: user.role, birthDate: user.birthDate, phoneNumber: user.phoneNumber })

        await this.redisService.setex(`session:${sessionId}`, sessionData, 7 * 24 * 60 * 60);

        const cookiePayload: string = `${sessionId}.${refreshToken}`;

        return {
            access_token: token,
            cookiePayload
        }

    }

    async refreshToken(authPayload?: string) {
        if (!authPayload) {
            throw new UnauthorizedException('No auth payload');
        }

        const [sessionId, rawRefreshToken] = authPayload.split(".");
        if (!sessionId || !rawRefreshToken) throw new UnauthorizedException(`Malformed payload`);

        const sessionDataStr: any = await this.redisService.get(`session:${sessionId}`);
        if (!sessionDataStr) throw new UnauthorizedException('Session expired or invalid');

        const sessionData: AccessToken = JSON.parse(sessionDataStr);
        if (!sessionData.hashedToken) throw new NotFoundException(`hashed token not found`);

        const isValidToken = await this.hashService.compare(rawRefreshToken, sessionData.hashedToken);
        if (!isValidToken) {
            await this.redisService.del(`session:${sessionId}`);
            console.warn(`Token reuse detected for user ${sessionData.sub}! Session destroyed.`);
            throw new ForbiddenException('Security breach detected. Please log in again.');
        }

        const { hashedToken: _, ...result } = sessionData
        const newAccessToken = this.jwt.sign(result);
        const newRefreshToken = crypto.randomBytes(40).toString('hex');
        const newHashedToken = await this.hashService.hash(newRefreshToken);

        const REFRESH_TTL = 7 * 24 * 60 * 60;

        const newSessionData = JSON.stringify({ userId: sessionData.sub, tokenHash: newHashedToken, username: sessionData.username, email: sessionData.email, role: sessionData.role, birthDate: sessionData.birthDate, phoneNumber: sessionData.phoneNumber });

        await this.redisService.setex(`session:${sessionId}`, newSessionData, REFRESH_TTL);

        return {
            accessToken: newAccessToken,
            newCookiePayload: `${sessionId}.${newRefreshToken}`,
            maxAge: REFRESH_TTL * 1000,
        };
    }

    async verifyUserEmail(email: string) {
        const userDataStr = await this.redisService.get(`tempUser:${email}`);
        if (!userDataStr) throw new NotFoundException(`user not found`);
        const user_data: TempUser = JSON.parse(userDataStr);
        try {
            const newUser = await this.prisma.user.create({
                data: {
                    username: user_data.username,
                    email: user_data.email,
                    passwordHash: user_data.password_hash,
                    birthDate: new Date(user_data.birth_date),
                    phoneNumber: user_data.phone_number,
                    isVerified: true
                },
            });
            if (!newUser) throw new Error(`error while create new user in the Database`);
            this.redisService.del(`tempUser:${email}`);
            return { message: 'user verified successfully' };
        } catch (error) {
            throw new Error(`Error while verifing user's email: ${error}`);
        }
    }

    async logOutUser(authPayload?: string) {
        if (!authPayload) {
            throw new UnauthorizedException('No auth payload');
        }

        const [sessionId, rawRefreshToken] = authPayload.split(".");
        if (!sessionId || !rawRefreshToken) throw new UnauthorizedException(`Malformed payload`);

        await this.redisService.del(`session:${sessionId}`);

        return { message: 'user logedout successfully' };
    }
}
