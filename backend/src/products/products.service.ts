import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Create a new product
  async create(data: { name: string; sku: string; price: number; stock_quantity: number; category?: string }) {
    return this.prisma.product.create({ data });
  }

  // Get all products
  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // Find a specific product by ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // Update stock or price
  async update(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // Delete a product
  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}