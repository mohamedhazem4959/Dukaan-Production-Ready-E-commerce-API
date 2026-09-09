import { createZodDto } from "nestjs-zod";
import { zSafeString } from "../../../common/utils/zod.utils";
import z from "zod";

export const updateUserInfoSchema = z.object({
    username: zSafeString(z.string().min(3).max(20, "name must not exceed 20 characters")).optional(),
    birth_date: z.string().date("Invalid date format. Use YYYY-MM-DD").optional(),
    phone_number: zSafeString(z.string()).optional()
})

export class UpdateUserInfoDto extends createZodDto(updateUserInfoSchema) {}