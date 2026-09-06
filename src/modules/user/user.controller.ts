import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AddUserAddressDto } from './dto/add-address.dto';
import { UserService } from './user.service';
import { type Request } from 'express';
import { UpdateUserInfoDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';
@Controller('user')
export class UserController {

    constructor(
        private readonly userService: UserService
    ) { }

    @Patch('change-password')
    @UseGuards(AuthGuard)
    async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
        const user = req['user'] as any;
        const userId = user.sub;
        return this.userService.changePassword(userId, dto);
    }

    @Post('address')
    @UseGuards(AuthGuard)
    async addNewAddress(@Req() req: Request, @Body() userAddress: AddUserAddressDto) {
        const user = req['user'] as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const userId = user.sub;
        return this.userService.addUserAddress(userAddress, userId);
    }

    @Get()
    @UseGuards(AuthGuard)
    async getUserInfo(@Req() req: Request) {
        const user = req['user'] as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const userId = user.sub;

        return this.userService.getUserInfo(userId);
    }

    @Put()
    @UseGuards(AuthGuard)
    async updateUserInfo(@Req() req: Request, @Body() userInfo: UpdateUserInfoDto) {
        const user = req['user'] as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const userId = user.sub;

        return this.userService.updateUserInfo(userInfo, userId);
    }

    @Put('address/:addressId')
    @UseGuards(AuthGuard)
    async updateUserAddress(@Req() req: Request, @Param('addressId', ParseIntPipe) addressId: number, @Body() userAddress: AddUserAddressDto) {
        const user = req['user'] as any;
        const userId = user.sub;

        return this.userService.updateUserAddress(userAddress, userId, addressId)
    }

    @Get('address/:addressId')
    @UseGuards(AuthGuard)
    async getUserAddress(@Req() req: Request, @Param('addressId', ParseIntPipe) addressId: number) {
        const user = req['user'] as any;
        const userId = user.sub;

        return this.userService.getUserAddress(userId, addressId)
    }

    @Get('address')
    @UseGuards(AuthGuard)
    async getAllUserAddresses(@Req() req: Request) {
        const user = req['user'] as any;
        const userId = user.sub;

        return this.userService.getUserAddresses(userId)
    }

    @Delete('address/:addressId')
    @UseGuards(AuthGuard)
    async deleteUserAddress(@Req() req: Request, @Param('addressId', ParseIntPipe) addressId: number) {
        const user = req['user'] as any;
        const userId = user.sub;

        return this.userService.deleteUserAddress(userId, addressId)
    }
}
