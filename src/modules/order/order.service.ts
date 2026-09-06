import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma.service';
import { UserService } from '../user/user.service';
import { OrderStatus, paymentMethod, Prisma } from 'src/generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { CartItem } from './interface/cart-items.interface';
import { OrderItem } from './interface/order-items.interface';
import { PromoService } from '../promo/promo.service';
import { PaymentService } from '../payment/payment.service';


@Injectable()
export class OrderService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly promoService: PromoService,
    private readonly paymentService: PaymentService,
  ) { }

  async create(createOrderDto: CreateOrderDto, userId: number) {
    if (createOrderDto.shippingAddressId) {
      // get address info add attach it to dto
      const userAddress = await this.userService.getUserAddress(userId, createOrderDto.shippingAddressId);
      if (!userAddress) throw new NotFoundException(`Address is not found`);

      createOrderDto.address = {
        shippingCity: userAddress.city,
        shippingBuilding: userAddress.building,
        shippingStreet: userAddress.street
      }
    }

    const { order, cartItems, user } = await this.prisma.$transaction(async (tx) => {

      // get user
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, phoneNumber: true },
      });
      if (!user) throw new NotFoundException('User not found');

      // 1. get user's cart
      const cart = await this.getUserCart(tx, userId);

      // 2. lock required stock rows
      const stocks = await this.lockStockRows(tx, cart.items);

      //3. validate stock
      await this.validateStock(stocks, cart.items);

      //4. get total amount
      const subtotal = await this.getTotalAmount(tx, cart.items);
      let totalAmount = subtotal;
      let promoCampaignId: number | null = null;
      let usageLimit: number = 0;

      if (createOrderDto.promoCode) {
        const campaign = await this.promoService.validatePromoCampaign(tx, userId, createOrderDto.promoCode);
        const discount = this.promoService.calculateDiscount(campaign.promo, subtotal);
        totalAmount = subtotal.sub(discount);
        promoCampaignId = campaign.id;
        usageLimit = campaign.usageLimit;
      }

      //5. create order
      const order = await this.createOrder(tx, createOrderDto, userId, totalAmount);

      if (promoCampaignId) {
        await this.promoService.usePromo(tx, userId, promoCampaignId, usageLimit, order.id);
      }

      //6. create order items
      const orderItems: OrderItem[] = cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price
      }));

      await this.createOrderItems(tx, orderItems);

      //7. decrease stock
      await this.decreaseStock(tx, cart.items);

      //8. clear cart
      await this.clearCart(tx, cart.id);

      return { order, cartItems: cart.items, user };

    })

    // create payment
    if (createOrderDto.paymentMethod === 'CREDIT_CARD') {
      const nameParts = user.username.trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'Name';

      const paymentResult = await this.paymentService.createPayment({
        orderId: order.id,
        amount: Number(order.totalAmount),
        currency: 'EGP',
        customer: {
          firstName,
          lastName,
          email: user.email,
          phone: user.phoneNumber || '01000000000',
        },
        items: cartItems.map((ci) => ({
          quantity: ci.quantity,
          price: Number(ci.product.price),
          product: { productName: ci.product.productName },
        })),
        address: createOrderDto.address,
      });
      return {
        ...order,
        payment: {
          checkoutUrl: paymentResult.checkoutUrl,
          clientSecret: paymentResult.clientSecret
        },
      };
    }
    return { ...order, payment: null };
  }

  async getUserOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId: userId },
      select: {
        shippingCity: true,
        shippingBuilding: true,
        shippingStreet: true,
        orderStatus: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                productName: true,
                productImages: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (orders.length === 0) throw new NotFoundException(`There no orders for user with id ${userId}`);

    return orders;
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      select: {
        user: {
          select: {
            id: true,
            username: true,
          }
        },
        shippingCity: true,
        shippingBuilding: true,
        shippingStreet: true,
        orderStatus: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                productName: true,
                productImages: true,
                price: true,
              },
            },
          },
        },
      },
    });
  }

  async updateOrderStatus(order_status: OrderStatus, orderId: number) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: order_status
      },
    });
  }

  async cancelOrder(orderId: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {

      const orders = await tx.$queryRaw<{ id: number; orderStatus: OrderStatus }[]>`
        SELECT "id", "orderStatus"
        FROM "Order"
        WHERE "id" = ${orderId} AND "userId" = ${userId}
        FOR UPDATE
      `;

      if (!orders || orders.length === 0) {
        throw new NotFoundException('Order not found');
      }

      const order = orders[0];

      if (order.orderStatus !== OrderStatus.PENDING) {
        throw new BadRequestException(`Order cannot be cancelled because it is in '${order.orderStatus}' status`);
      }

      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of orderItems) {
        await tx.stock.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.CANCELLED,
        },
      });
    });
  }

  async getOrderById(orderId: number, userId: number) {
    return this.prisma.order.findUnique({
      where: { id: orderId, userId },
      select: {
        shippingCity: true,
        shippingBuilding: true,
        shippingStreet: true,
        orderStatus: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                productName: true,
                productImages: true,
                price: true,
              },
            },
          },
        },
      },
    });
  }

  private async getTotalAmount(tx: Prisma.TransactionClient, cartItems: CartItem[]) {

    return cartItems.reduce(
      (total, item) =>
        total.add(
          item.product.price.mul(item.quantity),
        ),
      new Prisma.Decimal(0),
    );
  }

  private async getUserCart(tx: Prisma.TransactionClient, userId: number) {
    const cart = await tx.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          where: { isDeleted: false },
          select: {
            productId: true,
            quantity: true,
            product: {
              select: {
                isDeleted: true,
                id: true,
                productName: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!cart) throw new NotFoundException(`cart not found`);

    if (cart.items.length === 0) throw new BadRequestException('cart is empty');

    for (const item of cart.items) {
      if (item.product.isDeleted) {
        throw new BadRequestException(`Product ${item.product.productName} is not longer available. Please remove it from cart`);
      }
    }
    return cart;
  }

  private async lockStockRows(tx: Prisma.TransactionClient, items: CartItem[]) {
    const productIds = items.map((item) => item.productId).sort((a, b) => a - b);

    return tx.$queryRaw<{ id: number, productId: number, quantity: number }[]>`
      SELECT 
      "id",
      "productId",
      "quantity"
      FROM "Stock"
      WHERE "productId" IN (${Prisma.join(productIds)})
      ORDER BY "productId" ASC
      FOR UPDATE
    `
  }

  private async validateStock(stocks: { id: number, productId: number, quantity: number }[], cartItems: CartItem[]) {
    const stockMap = new Map(stocks.map((stock) => [stock.productId, stock]),);

    for (const item of cartItems) {
      const stock = stockMap.get(item.productId);

      if (!stock) throw new NotFoundException(`Stock not found for product ${item.productId}`);

      if (stock.quantity < item.quantity) throw new BadRequestException(`Insufficient stock for ${item.product.productName}`);
    }
    return true;
  }

  private async createOrder(tx: Prisma.TransactionClient, dto: CreateOrderDto, userId: number, totalAmount: Decimal) {
    if (!dto.address) {
      throw new BadRequestException('no address provided');
    }
    return tx.order.create({
      data: {
        userId,
        shippingAddressId: dto.shippingAddressId,
        shippingCity: dto.address.shippingCity,
        shippingStreet: dto.address.shippingStreet,
        shippingBuilding: dto.address.shippingBuilding,
        totalAmount,
        paymentMethod: dto.paymentMethod
      }
    })
  }

  private async createOrderItems(tx: Prisma.TransactionClient, orderItems: OrderItem[]) {
    return tx.orderItem.createMany({
      data: orderItems
    })
  }

  private async decreaseStock(tx: Prisma.TransactionClient, cartItems: CartItem[]) {
    for (const item of cartItems) {
      await tx.stock.update({
        where: { productId: item.productId },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      })
    }
    return true;
  }

  private async clearCart(tx: Prisma.TransactionClient, cartId: number) {
    return tx.cartItem.updateMany({
      where: { cartId, isDeleted: false },
      data: {
        isDeleted: true,
        quantity: 0
      }
    })
  }
}
