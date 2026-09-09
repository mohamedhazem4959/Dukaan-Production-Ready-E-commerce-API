import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartItemModule } from './cart-item/cart-item.module';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService],
  imports: [CartItemModule],
  exports: [CartService]
})
export class CartModule {}
