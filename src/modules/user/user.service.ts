import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AddUserAddressDto } from './dto/add-address.dto';
import { PrismaService } from 'src/prisma.service';
import { UpdateUserInfoDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { HashingService } from 'src/common/services/hashing.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/wasm-compiler-edge';

@Injectable()
export class UserService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly hashingService: HashingService
    ) { }

    async changePassword(userId: number, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.passwordHash) {
            throw new NotFoundException('User not found');
        }

        const isMatch = await this.hashingService.compare(dto.oldPassword, user.passwordHash);
        if (!isMatch) {
            throw new BadRequestException('Incorrect old password');
        }

        const newPasswordHash = await this.hashingService.hash(dto.newPassword);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newPasswordHash,
            },
        });

        return { message: 'Password updated successfully' };
    }

    async updateUserInfo(userInfo: UpdateUserInfoDto, user_id: number) {
        return this.prisma.user.update({
            where: { id: user_id },
            data: {
                username: userInfo.username,
                birthDate: userInfo.birth_date,
                phoneNumber: userInfo.phone_number
            }
        })
    }

    async getUserInfo(user_id: number) {
        return this.prisma.user.findUnique({
            where: { id: user_id },
            select: {
                username: true,
                email: true,
                birthDate: true,
                phoneNumber: true,
                addresses: {
                    select: {
                        city: true,
                        street: true,
                        building: true,
                        isDefault: true
                    }
                }
            }
        })
    }
    async addUserAddress(userAddress: AddUserAddressDto, user_id: number) {
        return this.prisma.userAddress.create({
            data: {
                userId: user_id,
                city: userAddress.city,
                street: userAddress.street,
                building: userAddress.bulding,
                isDefault: userAddress.isDefault
            }
        })
    }

    async updateUserAddress(userAddress: AddUserAddressDto, userId: number, addressId: number) {
        try {
            return this.prisma.userAddress.update({
                where: { id: addressId, userId },
                data: {
                    city: userAddress.city,
                    street: userAddress.street,
                    building: userAddress.bulding,
                    isDefault: userAddress.isDefault
                }
            })
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new BadRequestException('You are not allowed to update this address');
                }
            }
            throw error;
        }
    }

    async getUserAddresses(userId: number) {
        return this.prisma.userAddress.findMany({
            where: { userId },
            select: {
                id: true,
                userId: true,
                city: true,
                street: true,
                building: true,
                isDefault: true,
            }
        })
    }

    async getUserAddress(userId: number, addressId: number) {
        return this.prisma.userAddress.findUnique({
            where: { id: addressId, userId },
            select: {
                id: true,
                userId: true,
                city: true,
                street: true,
                building: true,
                isDefault: true,
            }
        })
    }

    async deleteUserAddress(userId: number, addressId: number) {
        try {
            return this.prisma.userAddress.delete({
                where: { id: addressId, userId },
            })
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new BadRequestException('You are not allowed to delete this address');
                }
            }
            throw error;
        }
    }
}
