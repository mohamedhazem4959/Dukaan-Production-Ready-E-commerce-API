import { createZodDto } from 'nestjs-zod';
import { OrderStatus } from '../../../generated/prisma/enums';
import { z } from 'zod';

const updateOrderStatusSchema = z.object({
    order_status: z.enum(OrderStatus)
});

export class updateOrderStatusDto extends createZodDto(updateOrderStatusSchema) { }