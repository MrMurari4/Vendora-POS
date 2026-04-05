import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    // Safety Check: If the URL is missing, stop the app immediately with a clear error
    if (!connectionString) {
      console.error("❌ ERROR: DATABASE_URL is not defined in .env file!");
      throw new InternalServerErrorException("Database connection string missing");
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}