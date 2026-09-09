import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    const connectionString =
      configService.get<string>("DATABASE_URL_PROD") ||
      configService.get<string>("DATABASE_URL") ||
      process.env.DATABASE_URL_PROD ||
      process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set! Please define DATABASE_URL or DATABASE_URL_PROD in your environment variables.",
      );
    }

    const adapter = new PrismaPg({
      connectionString,
    });
    super({ adapter });
  }
}