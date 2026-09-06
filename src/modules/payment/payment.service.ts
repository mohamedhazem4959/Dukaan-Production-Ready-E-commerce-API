import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentProvider, PaymentStatus, OrderStatus, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentRequest } from './gateway/types/create-payment.request';
import { CreatePaymentResult } from './gateway/types/create-payment.result';
import { PAYMENT_GATWAY } from './constants/payment.constants';
import { type PaymentGateway } from './gateway/payment.gateway';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(PAYMENT_GATWAY)
        private readonly paymentGateway: PaymentGateway
    ) { }

    async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResult> {
        const payment = await this.prisma.payment.create({
            data: {
                orderId: request.orderId,
                provider: request.provider ?? PaymentProvider.PAYMOB,
                amount: request.amount,
                currency: request.currency,
                status: PaymentStatus.PENDING,
            },
        });

        const result = await this.paymentGateway.createPayment(request);

        await this.prisma.payment.update({
            where: {
                id: payment.id,
            },
            data: {
                providerPaymentId: result.providerPaymentId,
            },
        });
        return result;
    }

    async handleWebhookTransaction(orderId: number, transactionId: number, isSuccess: boolean) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });

            if (!order) {
                this.logger.error(`Order #${orderId} not found during webhook processing`);
                return;
            }

            if (order.orderStatus === OrderStatus.PROCESSING || order.orderStatus === OrderStatus.SHIPPED) {
                return;
            }

            if (isSuccess) {
                await tx.payment.updateMany({
                    where: { orderId: order.id },
                    data: {
                        status: PaymentStatus.PAID,
                        providerPaymentId: String(transactionId),
                    },
                });

                await tx.order.update({
                    where: { id: order.id },
                    data: { orderStatus: OrderStatus.PROCESSING },
                });

                this.logger.log(`Order #${orderId} successfully paid via Paymob transaction #${transactionId}`);
            } else {
                await tx.payment.updateMany({
                    where: { orderId: order.id },
                    data: {
                        status: PaymentStatus.FAILED,
                        providerPaymentId: String(transactionId),
                    },
                });

                await tx.order.update({
                    where: { id: order.id },
                    data: { orderStatus: OrderStatus.CANCELLED },
                });

                for (const item of order.items) {
                    await tx.stock.update({
                        where: { productId: item.productId },
                        data: {
                            quantity: { increment: item.quantity },
                        },
                    });
                }

                this.logger.warn(`Order #${orderId} payment failed. Stock restored.`);
            }
        });
    }

    async getOrderStatus(orderId: number, userId: number) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
            select: {
                id: true,
                orderStatus: true,
                totalAmount: true,
                payments: {
                    select: {
                        id: true,
                        status: true,
                        provider: true,
                        updatedAt: true,
                    },
                },
            },
        });

        if (!order) throw new NotFoundException('Order not found');
        return order;
    }
}
