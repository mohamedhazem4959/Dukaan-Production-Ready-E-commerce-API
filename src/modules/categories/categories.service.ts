import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CategoriesService {

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  createCategory(createCategoryDto: CreateCategoryDto) {
    try {
      return this.prisma.category.create({
        data: {
          categoryName: createCategoryDto.categoryName,
          parentId: createCategoryDto.categoryParentId
        }
      })
    } catch (error) {
      throw new Error(`error while create new category: ${error}`);
    }
  }

  findAllCategories() {
    try {
      return this.prisma.category.findMany({
        select: {
          id: true,
          categoryName: true,
          parentId: true,
          subCategories: true,
        }
      })
    } catch (error) {
      throw new Error(`error while getting categories: ${error}`);
    }
  }

  findOneCategory(category_id: number) {
    try {
      return this.prisma.category.findUnique({
        where: {
          id: category_id
        },
        select: {
          id: true,
          categoryName: true,
          parentId: true,
          subCategories: true,
        }
      })
    } catch (error) {
      throw new Error(`error while getting category with id:${category_id}, ${error}`);
    }
  }

  updateCategory(category_id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      return this.prisma.category.updateMany({
        where: { id: category_id },
        data: {
          categoryName: updateCategoryDto.categoryName,
          parentId: updateCategoryDto.categoryParentId
        }
      })
    } catch (error) {
      throw new Error(`error while updating category with id ${category_id}, ${error}`);
    }
  }

  removeCategory(category_id: number) {
    try {
      return this.prisma.category.delete({
        where: {id: category_id}
      })
    } catch (error) {
      throw new Error(`error while deleting category with id: ${category_id}, ${error}`);
    }
  }
}
