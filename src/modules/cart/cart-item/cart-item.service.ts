import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { CartService } from '../cart.service';

@Injectable()
export class CartItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService
  ) { }

  async create(createCartItemDto: CreateCartItemDto, userId: number) {

    try {
      return await this.createCartItemTransaction(createCartItemDto, userId);
    } catch (error) {

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.createCartItemTransaction(createCartItemDto, userId)
      }

      throw error
    }

  }

  findAll(cartId: number) {
    return this.prisma.cartItem.findMany({
      where: { cartId, isDeleted: false },
      select: {
        cartId: true,
        productId: true,
        quantity: true,
        product: {
          select: {
            id: true,
            productName: true,
            productImages: true,
            stock: {
              select: {
                quantity: true,
              },
            },
            price: true
          }
        }
      }
    })
  }

  findOne(cartId: number, productId: number) {
    return this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        isDeleted: false
      },
      select: {
        product: {
          select: {
            id: true,
            productName: true,
            productDescription: true,
            productImages: true,
            stock: {
              select: { quantity: true },
            },
            price: true
          }
        }
      }
    })
  }

  async update(cartId: number, productId: number, updateCartItemDto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        isDeleted: false
      },
    });

    if (!item) {
      throw new NotFoundException(`Cart item not found`);
    }

    return this.prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId,
          productId
        },
      },
      data: updateCartItemDto,
    });
  }

  async remove(cartId: number, productId: number) {

    return this.prisma.$transaction(async (tx) => {

      const checkItemQuantity = await this.checkCartItem(tx, cartId, productId);

      if (checkItemQuantity?.quantity === 1) {
        return tx.cartItem.update({
          where: {
            cartId_productId: {
              cartId,
              productId
            }
          },
          data: {
            quantity: {
              decrement: 1
            },
            isDeleted: true
          }
        })
      }

      return tx.cartItem.update({
        where: {
          cartId_productId: {
            cartId,
            productId
          }
        },
        data: {
          quantity: {
            decrement: 1
          }
        }
      })
    })

  }

  private checkItemExist(tx: Prisma.TransactionClient, cartId: number, productId: number) {
    return tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId
        },
      },
    });
  }

  private restoreCartItem(tx: Prisma.TransactionClient, cartId: number, productId: number, itemQuantity: number) {
    return tx.cartItem.update({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
      data: {
        isDeleted: false,
        quantity: itemQuantity
      }
    })
  }

  private checkCartItem(
    tx: Prisma.TransactionClient,
    cartId: number,
    productId: number,
  ) {
    return tx.cartItem.findFirst({
      where: {
        cartId,
        productId,
        isDeleted: false,
      },
    });
  }

  private createCartItem(tx: Prisma.TransactionClient, dto: CreateCartItemDto, cartId: number) {
    return tx.cartItem.create({
      data: {
        cartId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });
  }

  private incrementCartItem(
    tx: Prisma.TransactionClient,
    cartId: number,
    productId: number,
    quantity: number,
  ) {
    return tx.cartItem.update({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
      data: {
        quantity: {
          increment: quantity,
        },
      },
    });
  }

  private createCartItemTransaction(dto: CreateCartItemDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {

      const existingCart = await this.cartService.findCartByUserId(tx, userId);

      const cart = existingCart ?? await this.cartService.create(tx, userId);

      const item = await this.checkItemExist(
        tx,
        cart.id,
        dto.productId,
      );

      if (!item) {
        return this.createCartItem(tx, dto, cart.id);
      }

      if (item.isDeleted) {
        return this.restoreCartItem(
          tx,
          cart.id,
          dto.productId,
          dto.quantity,
        );
      }

      return this.incrementCartItem(
        tx,
        cart.id,
        dto.productId,
        dto.quantity,
      );
    });
  }

}
