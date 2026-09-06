import { Controller, Post, Body, UseGuards, Req, Param, Get, ParseIntPipe, Patch } from '@nestjs/common';
import { PromoService } from './promo.service';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoStatusDto } from './dto/update-promo-status.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';

@Controller('promo')
export class PromoController {
  constructor(
    private readonly promoService: PromoService,
    private readonly prisma: PrismaService
  ) {}

  @UseGuards(AuthGuard)
  @Post('validate')
  async validatePromo(@Body() dto: ValidatePromoDto, @Req() req: Request) {
    const user = req['user'] as any;
    const userId = user.sub;

    return this.prisma.$transaction(async (tx) => {
      const subtotalDecimal = new Prisma.Decimal(dto.subtotal);
      
      const campaign = await this.promoService.validatePromoCampaign(tx, userId, dto.promoCode);
      const discount = this.promoService.calculateDiscount(campaign.promo, subtotalDecimal);
      const finalAmount = subtotalDecimal.sub(discount);

      return {
        originalAmount: subtotalDecimal,
        discountAmount: discount,
        finalAmount: finalAmount,
      };
    });
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async createPromo(@Body() createPromoDto: CreatePromoDto) {
    return this.promoService.createPromo(createPromoDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async getAllPromos() {
    return this.promoService.getAllPromos();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  async updateCampaignStatus(
    @Param('id', ParseIntPipe) campaignId: number,
    @Body() dto: UpdatePromoStatusDto
  ) {
    return this.promoService.updateCampaignStatus(campaignId, dto.isActive);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  async getPromoCampaign(@Param('id', ParseIntPipe) campaignId: number) {
    return this.promoService.getPromoCampaign(campaignId);
  }
}
