import { Module } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CartItemController } from './cart-item.controller';
import { PrismaService } from '../../../prisma.service';
import { CartService } from '../cart.service';

@Module({
  controllers: [CartItemController],
  providers: [CartItemService, PrismaService, CartService],
})
export class CartItemModule {}
