import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('Login attempt for email:', dto.email);
    const tokens = await this.authService.login(dto.email, dto.password);
    console.log('Login successful, setting cookies', tokens);
    this.setTokenCookies(
      res,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );
    return { expiresIn: tokens.expiresIn };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const tokens = await this.authService.refresh(refreshToken);
    this.setTokenCookies(
      res,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );
    return { expiresIn: tokens.expiresIn };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (refreshToken) {
      await this.authService.logout(refreshToken).catch(() => {});
    }
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/auth' });
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ) {
    res.cookie('accessToken', accessToken, {
      ...COOKIE_BASE,
      maxAge: expiresIn * 1000,
      path: '/',
    });
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_BASE,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth',
    });
  }
}
