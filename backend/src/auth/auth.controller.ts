import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // We use HttpCode 200 (OK) instead of the default 201 (Created) for logins
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    // We pass the email and password from the request body to the service
    return this.authService.login(signInDto.email, signInDto.password);
  }

  // 👇 ADD THIS NEW ROUTE 👇
  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  // 👇 ADD THIS NEW ROUTE 👇
  @Post('reset-password')
  resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }
}
