import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../../common/decorator/role.decorator';
import { AuthGuard } from '../../common/guard/auth.guard';
import { RolesGuard } from '../../common/guard/role.guard';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAllCategories();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) category_id: number) {
    return this.categoriesService.findOneCategory(category_id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put(':id')
  update(@Param('id', ParseIntPipe) category_id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(category_id, updateCategoryDto);
  }


  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) category_id: number) {
    return this.categoriesService.removeCategory(category_id);
  }
}
