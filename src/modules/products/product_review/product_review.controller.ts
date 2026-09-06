import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, ParseIntPipe, Put } from '@nestjs/common';
import { ProductReviewService } from './product_review.service';
import { CreateProductReviewDto } from './dto/create-product_review.dto';
import { UpdateProductReviewDto } from './dto/update-product_review.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';

@Controller('product-review')
export class ProductReviewController {
  constructor(private readonly productReviewService: ProductReviewService) { }


  @UseGuards(AuthGuard)
  @Post(':productId')
  create(@Param('productId', ParseIntPipe) productId: number, @Req() req: Request, @Body() createProductReviewDto: CreateProductReviewDto) {
    return this.productReviewService.create(createProductReviewDto, productId, req['user'].sub);
  }

  @Get(':productId')
  findAll(@Param('productId', ParseIntPipe) productId: number) {
    return this.productReviewService.findAll(productId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productReviewService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Body() updateProductReviewDto: UpdateProductReviewDto) {
    return this.productReviewService.update(id, req['user'].sub, updateProductReviewDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.productReviewService.remove(id, req['user'].sub);
  }
}
