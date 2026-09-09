import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { OrderStatus, PaymentStatus } from '../../generated/prisma/client';

@Injectable()
export class OrderCleanupService {
    private readonly logger = new Logger(OrderCleanupService.name);

    constructor(private readonly prisma: PrismaService) { }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async cancelExpiredPendingOrders() {
        const expirationCutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

        const expiredOrders = await this.prisma.order.findMany({
            where: {
                orderStatus: OrderStatus.PENDING,
                paymentMethod: 'CREDIT_CARD',
                createdAt: { lt: expirationCutoff },
            },
            include: { items: true },
        });

        for (const order of expiredOrders) {
            await this.prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: order.id },
                    data: { orderStatus: OrderStatus.CANCELLED },
                });

                await tx.payment.updateMany({
                    where: { orderId: order.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.FAILED },
                });

                for (const item of order.items) {
                    await tx.stock.update({
                        where: { productId: item.productId },
                        data: { quantity: { increment: item.quantity } },
                    });
                }
            });

            this.logger.log(`Auto-cancelled expired pending order #${order.id} and restored stock.`);
        }
    }
}