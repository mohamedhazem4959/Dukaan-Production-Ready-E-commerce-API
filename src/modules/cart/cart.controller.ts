import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/common/guard/auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @UseGuards(AuthGuard)
  @Get()
  getCart(@Req() req: Request) {
    const user = req['user'] as any;
    const userId = user.sub;

    return this.cartService.getCart(userId);
  }

  @UseGuards(AuthGuard)
  @Delete()
  clearCart(@Req() req: Request) {
    const user = req['user'] as any;
    const userId = user.sub;

    return this.cartService.clearCart(userId);
  }
}
