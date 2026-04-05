import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // This makes Prisma available everywhere without importing the module repeatedly
@Module({
  providers: [PrismaService],
  exports: [PrismaService], 
})
export class PrismaModule {}