import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../../prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { UploadedFile } from '../uploads/interfaces/uploaded-file.interface';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class ProductsService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService
  ) { }

  async create(createProductDto: CreateProductDto, files: Express.Multer.File[]) {
    let uploadedFiles: UploadedFile[] = [];

    try {
      uploadedFiles = await this.uploadImages(files);

      return await this.createProduct(createProductDto, uploadedFiles);
    } catch (error) {
      await this.deleteUploadedFiles(uploadedFiles);
      throw error;
    }
  }

  findAll() {
    try {
      return this.prisma.product.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          productName: true,
          productDescription: true,
          sku: true,
          stock: {
            select: {
              quantity: true,
            },
          },
          price: true,
          avgRating: true,
          totalReviews: true,
          category: {
            select: {
              id: true,
              categoryName: true,
              parent: true
            }
          },
          productImages: true
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, isDeleted: false },
        select: {
          id: true,
          productName: true,
          productDescription: true,
          sku: true,
          stock: {
            select: { quantity: true }
          },
          price: true,
          avgRating: true,
          totalReviews: true,
          category: {
            select: {
              id: true,
              categoryName: true,
              parent: true
            }
          },
          productImages: true
        }
      });

      if (!product) throw new NotFoundException(`product not found`);

      return product;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    try {
      const updatedProduct = await this.prisma.product.update({
        where: { id, isDeleted: false },
        data: {
          productName: dto.productName,
          productDescription: dto.productDescription,
          sku: dto.sku,
          categoryId: dto.categoryId,
          price: dto.price,
          stock: {
            update: {
              quantity: dto.quantity
            }
          }
        }
      });

      return updatedProduct;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`product with id ${id} is not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const deletedProduct = await this.prisma.product.update({
        where: { id, isDeleted: false },
        data: {
          isDeleted: true
        }
      });
      return {
        message: `product with id ${id} is deleted successfully`,
        deletedProduct: deletedProduct
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`product with id ${id} is not found`);
      } else {
        throw new ConflictException(`product with id ${id} is already deleted`);
      }
    }
  }

  async updateStock(productId: number, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
    });
    if (!product) throw new NotFoundException(`Product with id ${productId} not found`);

    return this.prisma.stock.upsert({
      where: { productId },
      update: { quantity },
      create: { productId, quantity },
    });
  }

  private async uploadImages(
    files: Express.Multer.File[]
  ) {
    return this.uploadsService.uploadMany(files, { folder: 'products' })
  }

  private async createProduct(dto: CreateProductDto, uploadedFiles: UploadedFile[]) {
    try {
      return this.prisma.product.create({
        data: {
          productName: dto.productName,
          productDescription: dto.productDescription,
          sku: dto.sku,
          categoryId: dto.categoryId,
          price: dto.price,
          stock: {
            create: {
              quantity: dto.quantity
            },
          },
          productImages: {
            create: uploadedFiles.map((file, index) => ({
              storageKey: file.storageKey,
              provider: file.provider,
              url: file.url,
              originalName: file.originalName,
              mimeType: file.mimeType,
              size: file.size,
              order: index,
              isPrimary: index === 0,
            }))
          }
        },
        include: {
          category: true,
          productImages: true,
          stock: true
        }
      })
    } catch (error: any) {
      throw new Error(`Error while creating product: ${error.message}`)
    }
  }

  private async deleteUploadedFiles(uploadedFiles: UploadedFile[]) {
    if (!uploadedFiles.length) {
      return;
    }

    const results = await Promise.allSettled(
      uploadedFiles.map((file) =>
        this.uploadsService.delete(file.storageKey),
      ),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.log(`Failed to delete uploaded file: ${uploadedFiles[index].storageKey}`, result.reason);
      }
    })
  }
}