import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Protect the entire controller!
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('checkout')
  checkout(@Request() req, @Body() body: { payment_method: string; items: { productId: string; quantity: number }[] }) {
    // We grab the cashier's ID directly from their secure token, NOT the body!
    const cashierId = req.user.userId; 
    return this.invoicesService.checkout(cashierId, body);
  }

  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }
}