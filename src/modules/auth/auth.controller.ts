import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { success } from '../../types/api';
import { loginSchema, refreshSchema, signupSchema } from '../../validators/authSchemas';
import { toUserResponse } from '../../utils/mappers';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequestWithUser } from '../../types/request';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  async signup(@Body() body: unknown) {
    const payload = signupSchema.parse(body);
    const result = await this.authService.signup(payload);

    return success(
      {
        user: toUserResponse(result.user),
        accessToken: result.tokenPair.accessToken,
        refreshToken: result.tokenPair.refreshToken,
        accessTokenExpiresAt: result.tokenPair.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: result.tokenPair.refreshTokenExpiresAt.toISOString(),
        sessionId: result.session.sessionId,
        sessionExpiresAt: result.session.expiresAt,
      },
      'Signup successful',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    const payload = loginSchema.parse(body);
    const result = await this.authService.login(payload);

    return success(
      {
        user: toUserResponse(result.user),
        accessToken: result.tokenPair.accessToken,
        refreshToken: result.tokenPair.refreshToken,
        accessTokenExpiresAt: result.tokenPair.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: result.tokenPair.refreshTokenExpiresAt.toISOString(),
        sessionId: result.session.sessionId,
        sessionExpiresAt: result.session.expiresAt,
        lastLoginAt: result.session.lastLoginAt,
      },
      'Login successful',
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown) {
    const payload = refreshSchema.parse(body);
    const result = await this.authService.refresh(payload.refreshToken);

    return success(
      {
        accessToken: result.tokenPair.accessToken,
        refreshToken: result.tokenPair.refreshToken,
        accessTokenExpiresAt: result.tokenPair.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: result.tokenPair.refreshTokenExpiresAt.toISOString(),
        sessionId: result.session.sessionId,
        sessionExpiresAt: result.session.expiresAt,
      },
      'Token refreshed successfully',
    );
  }

  @UseGuards(AuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Req() req: RequestWithUser) {
    const currentUser = req.currentUser;
    if (!currentUser) {
      throw new UnauthorizedException('Unauthorized');
    }

    const result = await this.authService.deleteAccount(currentUser);
    return success(
      {
        userID: currentUser.id,
        supabaseDeleted: result.supabaseDeleted,
      },
      'Account deleted successfully',
    );
  }
}
