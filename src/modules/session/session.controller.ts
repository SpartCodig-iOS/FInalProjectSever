import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { success } from '../../types/api';
import { SessionService } from '../../services/sessionService';

@ApiTags('Session')
@Controller('api/v1/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getSession(@Query('sessionId') sessionId?: string) {
    if (!sessionId) {
      throw new BadRequestException('Session ID parameter is required');
    }

    const session = this.sessionService.updateSessionLastLogin(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return success(
      {
        loginType: session.loginType || 'unknown',
        lastLoginAt: session.lastLoginAt || null,
        userId: session.userId,
        email: session.email,
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
      'Session info retrieved successfully',
    );
  }
}
