import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  // The payload coming from the frontend (Payment method + array of items)
  async checkout(cashierId: string, payload: { payment_method: string; customer_phone?: string; items: { productId: string; quantity: number }[] }) {
    
    // We use $transaction to ensure ALL steps succeed, or NOTHING saves.
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const invoiceItemsData: any[] = [];

      // Loop through each item in the cart
      for (const item of payload.items) {
        // Find the product
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product) {
          throw new BadRequestException(`Product with ID ${item.productId} not found`);
        }

        // STEP A: The Stock Check!
        if (product.stock_quantity < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${product.name}. Only ${product.stock_quantity} left.`);
        }

        // STEP B: Price Snapshot & Total Calculation
        totalAmount += product.price * item.quantity;
        
        invoiceItemsData.push({
          product_id: product.id,
          quantity: item.quantity,
          price_at_sale: product.price, // Lock in the current price!
        });

        // STEP C: Inventory Deduction
        await tx.product.update({
          where: { id: product.id },
          data: { stock_quantity: product.stock_quantity - item.quantity },
        });
      }

      // STEP D: Receipt Creation
      const invoice = await tx.invoice.create({
        data: {
          total_amount: totalAmount,
          payment_method: payload.payment_method,
          customer_phone: payload.customer_phone, 
          cashier_id: cashierId,
          items: {
            create: invoiceItemsData, // This creates all the linked items automatically!
          },
        },
        include: {
          items: true, // Return the item list so the frontend can print a receipt
        },
      });

      return invoice;
    });
  }

  // A route to get all invoices for the Admin Dashboard later
  async findAll() {
    return this.prisma.invoice.findMany({
      orderBy: { created_at: 'desc' },
      include: { 
        items: { include: { product: true } }, 
        cashier: { select: { name: true } } 
      },
    });
  }
}