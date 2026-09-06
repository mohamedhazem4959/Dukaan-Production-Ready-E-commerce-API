import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from '../user/user.module';
import { CartModule } from '../cart/cart.module';
import { PromoModule } from '../promo/promo.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [UserModule, CartModule, PromoModule, AuthModule, PaymentModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
})
export class OrderModule {}
