import { createZodDto } from 'nestjs-zod';
import { zSafeString } from '../../../common/utils/zod.utils';
import { paymentMethod } from '../../../generated/prisma/enums';
import { z } from 'zod';

const createOrderSchema = z.object({
    shippingAddressId: z.number().int().positive().optional(),
    address: z.object({
        shippingCity: zSafeString(z.string().max(30, "max city name contains 30 characters")),
        shippingStreet: zSafeString(z.string().max(30, "max city name contains 30 characters")),
        shippingBuilding: zSafeString(z.string().max(30, "max city name contains 30 characters")),
    }).optional(),
    paymentMethod: z.enum(paymentMethod),
    promoCode: z.string().optional(),
})
    .refine(
        (data) =>
            (data.shippingAddressId !== undefined) !==
            (data.address !== undefined),
        {
            message: "Provide either shippingAddressId or address, not both",
            path: ["shippingAddressId"],
        }
    );

export class CreateOrderDto extends createZodDto(createOrderSchema) { }