import { Body, Controller, Delete, ForbiddenException, Get, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { type Request, type Response } from 'express';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('sign-up')
    async signUp(@Body() createUser: CreateUserDto) {
        return this.authService.signUp(createUser);
    }

    @Post('sign-in')
    async signIn(@Body() loginUser: LoginUserDto, @Res({ passthrough: true }) res: Response) {
        const signInData = await this.authService.signIn(loginUser);
        res.cookie('authPayload', signInData.cookiePayload, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            access_token: signInData.access_token
        }
    }

    @Get('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const authPayload = req.cookies?.authPayload;

        try {
            const { accessToken, newCookiePayload, maxAge } = await this.authService.refreshToken(authPayload);

            res.cookie('authPayload', newCookiePayload, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: maxAge,
            });

            return { accessToken };
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
                res.clearCookie('authPayload');
            }
            throw error;
        }
    }

    @Get('verify')
    async verifyUserEmail(@Query() email: {email: string}){
        return this.authService.verifyUserEmail(email.email);
    }

    @Delete('logout')
    async LogoutUser(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
        const authPayload = request.cookies?.authPayload;
        try {
            const logout = await this.authService.logOutUser(authPayload);
            response.clearCookie('authPayload', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            })
            return logout;
        } catch (error) {
            throw new UnauthorizedException(`Error while logout user: ${error}`);
        }
    }

}
