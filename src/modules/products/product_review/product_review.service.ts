import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductReviewDto } from './dto/create-product_review.dto';
import { UpdateProductReviewDto } from './dto/update-product_review.dto';
import { PrismaService } from 'src/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/wasm-compiler-edge';

@Injectable()
export class ProductReviewService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createProductReviewDto: CreateProductReviewDto, productId: number, userId: number) {
    return await this.prisma.productReview.create({
      data: {
        ratingValue: createProductReviewDto.ratingValue,
        comment: createProductReviewDto.comment,
        productId,
        userId,
      }
    })
  }

  async findAll(productId: number) {
    return await this.prisma.productReview.findMany({
      where: { productId: productId },
      select: {
        id: true,
        ratingValue: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    });
  }

  async findOne(id: number) {
    return await this.prisma.productReview.findUnique({
      where: { id },
      select: {
        id: true,
        ratingValue: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    });
  }

  async update(id: number, userId: number, updateProductReviewDto: UpdateProductReviewDto) {
    try {
      return await this.prisma.productReview.update({
        where: { id, userId: userId },
        data: {
          ratingValue: updateProductReviewDto.ratingValue,
          comment: updateProductReviewDto.comment,
        },
        select: {
          id: true,
          ratingValue: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
            }
          }
        }
      });

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException('You are not allowed to update this review');
        }
      }
      throw error;
    }
  }

  async remove(id: number, userId: number) {
    try {
      return await this.prisma.productReview.delete({
        where: { id, userId: userId }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException('You are not allowed to delete this review');
        }
      }
      throw error;
    }
  }
}
