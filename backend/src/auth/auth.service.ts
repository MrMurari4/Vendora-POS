import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(email: string, pass: string) {
    // 1. Find the user in the database
    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    // 2. If no user is found, throw a 401 error
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Compare the typed password with the hashed password in the DB
    const isPasswordValid = await bcrypt.compare(pass, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Create the token payload (Data we want to pack inside the token)
    const payload = { sub: user.id, email: user.email, role: user.role };

    // 5. Return the token and some basic user info for the frontend UI
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
  async register(data: any) {
    // 1. Check if the user already exists to prevent duplicate emails
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    // 2. Hash the password for maximum security
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Save the new cashier to the database
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash: hashedPassword,
        role: data.role || 'CASHIER', // Defaults to CASHIER for safety
      },
    });

    // 4. Return success (but never return the password hash!)
    return { 
      message: 'Staff account created successfully!',
      userId: user.id,
      role: user.role
    };
  }
}