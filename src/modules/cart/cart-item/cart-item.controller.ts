import { Controller, Get, Post, Body, Delete, Req, UseGuards, Query, Put } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { type Request } from 'express';
import { AuthGuard } from '../../../common/guard/auth.guard';
import { CartItemsQueryDto } from './dto/cart-items-query.dto';

@Controller('cart-item')
export class CartItemController {
  constructor(private readonly cartItemService: CartItemService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: Request, @Body() createCartItemDto: CreateCartItemDto) {
    const user = req['user'] as any;
    const userId = user.sub;

    return this.cartItemService.create(createCartItemDto, userId);
  }

  @UseGuards(AuthGuard)
  @Get()
  findOne(@Query() query: CartItemsQueryDto) {
    return this.cartItemService.findOne(query.cartId, query.productId);
  }

  @UseGuards(AuthGuard)
  @Put()
  update(@Query() query: CartItemsQueryDto, @Body() updateCartItemDto: UpdateCartItemDto) {
    return this.cartItemService.update(query.cartId, query.productId, updateCartItemDto);
  }


  @Delete()
  remove(@Query() query: CartItemsQueryDto) {
    return this.cartItemService.remove(query.cartId, query.productId);
  }
}
