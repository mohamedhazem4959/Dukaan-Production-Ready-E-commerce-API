import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, PromoCode, PromoCampaign } from 'src/generated/prisma/client';

export type PromoCampaignWithPromoCode = PromoCampaign & { promo: PromoCode };

@Injectable()
export class PromoService {
    constructor(private readonly prisma: PrismaService) { }

    async validatePromoCampaign(
        tx: Prisma.TransactionClient,
        userId: number,
        promoCodeStr: string
    ): Promise<PromoCampaignWithPromoCode> {
        const promoCode = await tx.promoCode.findUnique({
            where: { promoCode: promoCodeStr },
            include: {
                campaigns: {
                    where: {
                        isActive: true,
                        startsAt: { lte: new Date() },
                        expiresAt: { gte: new Date() },
                    },
                },
            },
        });

        if (!promoCode) {
            throw new NotFoundException(`Promo code ${promoCodeStr} not found`);
        }
        if (!promoCode.isActive) {
            throw new BadRequestException(`Promo code ${promoCodeStr} is inactive`);
        }
        if (!promoCode.campaigns || promoCode.campaigns.length === 0) {
            throw new BadRequestException(`No active campaign found for promo code ${promoCodeStr}`);
        }

        // We use the first active campaign
        const campaign = promoCode.campaigns[0];

        if (campaign.usedCount >= campaign.usageLimit) {
            throw new BadRequestException(`Promo campaign limit reached`);
        }

        // Check if the user has already used this campaign
        const existingUsage = await tx.promoUsage.findUnique({
            where: {
                campaignId_userId: {
                    campaignId: campaign.id,
                    userId,
                },
            },
        });

        if (existingUsage) {
            throw new BadRequestException(`You have already used this promo code`);
        }

        return { ...campaign, promo: promoCode };
    }

    calculateDiscount(promoCode: PromoCode, subtotal: Prisma.Decimal): Prisma.Decimal {
        let discount = new Prisma.Decimal(0);

        if (promoCode.discountType === 'PERCENTAGE') {
            // subtotal * (discountValue / 100)
            discount = subtotal.mul(promoCode.discountValue.div(100));
        } else if (promoCode.discountType === 'FIXED_AMOUNT') {
            discount = promoCode.discountValue;
        }

        // Ensure discount does not exceed the subtotal
        if (discount.gt(subtotal)) {
            return subtotal;
        }

        return discount;
    }

    async usePromo(
        tx: Prisma.TransactionClient,
        userId: number,
        campaignId: number,
        usageLimit: number,
        orderId: number
    ): Promise<void> {
        // Create usage record
        await tx.promoUsage.create({
            data: {
                campaignId,
                userId,
                orderId,
            },
        });

        // Increment usage count with safety check
        const updateResult = await tx.promoCampaign.updateMany({
            where: {
                id: campaignId,
                usedCount: { lt: usageLimit },
            },
            data: {
                usedCount: { increment: 1 },
            },
        });

        if (updateResult.count === 0) {
            throw new BadRequestException('Promo campaign usage limit reached during processing');
        }
    }

    async getPromoCampaign(campaignId: number) {
        return this.prisma.promoCampaign.findUnique({
            where: { id: campaignId },
            select: {
                id: true,
                usageLimit: true,
                usedCount: true,
                startsAt: true,
                expiresAt: true,
                isActive: true,
                createdAt: true,
                promo: {
                    select: {
                        id: true,
                        promoCode: true,
                        discountType: true,
                        discountValue: true,
                        isActive: true
                    },
                },
                usages: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async createPromo(dto: {
        promoCode: string;
        discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
        discountValue: number;
        usageLimit: number;
        startsAt: Date;
        expiresAt: Date;
    }) {
        const existing = await this.prisma.promoCode.findUnique({
            where: { promoCode: dto.promoCode },
        });
        if (existing) {
            throw new BadRequestException(`Promo code '${dto.promoCode}' already exists`);
        }

        return this.prisma.promoCode.create({
            data: {
                promoCode: dto.promoCode,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                campaigns: {
                    create: {
                        usageLimit: dto.usageLimit,
                        startsAt: dto.startsAt,
                        expiresAt: dto.expiresAt,
                    },
                },
            },
            include: {
                campaigns: true,
            },
        });
    }

    async getAllPromos() {
        return this.prisma.promoCode.findMany({
            include: {
                campaigns: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateCampaignStatus(campaignId: number, isActive: boolean) {
        const campaign = await this.prisma.promoCampaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign) {
            throw new NotFoundException(`Promo campaign with ID ${campaignId} not found`);
        }

        return this.prisma.promoCampaign.update({
            where: { id: campaignId },
            data: { isActive },
            include: { promo: true },
        });
    }
}
