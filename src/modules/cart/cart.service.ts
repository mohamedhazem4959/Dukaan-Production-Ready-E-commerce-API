import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  create(tx: Prisma.TransactionClient, user_id: number) {
    return tx.cart.create({
      data: {
        userId: user_id
      }
    })
  }

  findAll() {
    return this.prisma.cart.findMany({
      select: {
        id: true,
        user: true,
        items: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

  findCartByUserId(tx: Prisma.TransactionClient, user_id: number) {
    return tx.cart.findUnique({
      where: { userId: user_id }
    })
  }

  async clearCart(userId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.validateUserCart(tx, userId);

      return tx.cartItem.updateMany({
        where: { cart: { userId } },
        data: {
          isDeleted: true,
          quantity: 0
        }
      })
    })
  }

  async getCart(userId: number) {
    const cart = await this.prisma.cart.findUnique({
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
                id: true,
                productName: true,
                price: true,
              },
            }
          }
        },
      },
    });

    if (!cart) {
      return null;
    }

    const totalPrice = cart.items.reduce(
      (total, item) =>
        total.add(
          item.product.price.mul(item.quantity),
        ),
      new Prisma.Decimal(0),
    );

    return {
      ...cart,
      totalPrice,
    };
  }

  private async validateUserCart(tx: Prisma.TransactionClient, userId: number) {
    const cart = await tx.cart.findUnique({
      where: { userId },
    })

    if (!cart) {
      throw new UnauthorizedException(`You are not authorized to modify this cart`);
    }

    return true;
  }
}
