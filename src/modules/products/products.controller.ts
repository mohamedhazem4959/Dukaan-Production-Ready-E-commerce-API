import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, UseGuards, ParseIntPipe, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImagesUploadPipe } from '../uploads/images-upload.pipe';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }


  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin')
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: memoryStorage(),
  }),
  )
  create(
    @Body() createProductDto: CreateProductDto,

    @UploadedFiles(new ImagesUploadPipe())
    files: Express.Multer.File[],
  ) {
    return this.productsService.create(createProductDto, files);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) product_id: number) {
    return await this.productsService.findOne(product_id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/:id')
  update(@Param('id', ParseIntPipe) product_id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(product_id, updateProductDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id/stock')
  updateStock(@Param('id', ParseIntPipe) product_id: number, @Body() updateStockDto: UpdateStockDto) {
    return this.productsService.updateStock(product_id, updateStockDto.quantity);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/:id')
  remove(@Param('id', ParseIntPipe) product_id: number) {
    return this.productsService.remove(product_id);
  }
}
