import { Controller, Post, Body, UseGuards, Req, Headers, ConflictException, BadRequestException, Get, Put, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '../../common/guard/auth.guard';
import type { Request } from 'express';
import { RolesGuard } from '../../common/guard/role.guard';
import { Roles } from '../../common/decorator/role.decorator';
import { updateOrderStatusDto } from './dto/update-order-status.dto';
import { RedisService } from '../../common/services/redis.service';
import { PaymentService } from '../payment/payment.service';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly redisService: RedisService,
    private readonly paymentService: PaymentService,
  ) { }

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: Request,
    @Headers('Idempotency-Key') idempotencyKey?: string
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const user = req['user'] as any;
    const userId = user.sub;

    const cacheKey = `idempotency:order:${userId}:${idempotencyKey}`;

    const existingState = await this.redisService.get(cacheKey);

    if (existingState === 'PROCESSING') {
      throw new ConflictException('Order is currently processing');
    }

    if (existingState) {
      return existingState;
    }

    await this.redisService.setex(cacheKey, 'PROCESSING', 300); // 5 mins

    try {
      const order = await this.orderService.create(createOrderDto, userId);
      await this.redisService.setex(cacheKey, JSON.stringify(order), 86400); // 24 hours
      return order;
    } catch (error) {
      await this.redisService.del(cacheKey);
      console.error('CREATE ORDER ERROR:', error);
      throw new BadRequestException(error.message || 'Order creation failed');
    }
  }

  @Get(':id/payment-status')
  async getPaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req['user'] as any;
    const userId = user.sub;
    return this.paymentService.getOrderStatus(id, userId);
  }


  @UseGuards(AuthGuard)
  @Get()
  async getUserOrders(@Req() req: Request) {
    const user = req['user'] as any;
    const userId = user.sub;

    return this.orderService.getUserOrders(userId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/all')
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/status/:id')
  async updateOrderStatus(@Param('id', ParseIntPipe) orderId: number, @Body() order: updateOrderStatusDto) {
    return this.orderService.updateOrderStatus(order.order_status, orderId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getOrderById(@Param('id', ParseIntPipe) orderId: number, @Req() req: Request) {
    const user = req['user'] as any;
    const userId = user.sub;
    return this.orderService.getOrderById(orderId, userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/cancel')
  async cancelOrder(@Param('id', ParseIntPipe) orderId: number, @Req() req: Request) {
    const user = req['user'] as any;
    const userId = user.sub;
    return this.orderService.cancelOrder(orderId, userId);
  }

}
