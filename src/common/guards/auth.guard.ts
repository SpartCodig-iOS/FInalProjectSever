import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestWithUser } from '../../types/request';
import { LoginType } from '../../types/auth';
import { JwtTokenService } from '../../services/jwtService';
import { SupabaseService } from '../../services/supabaseService';
import { fromSupabaseUser } from '../../utils/mappers';
import { UserRecord } from '../../types/user';

interface LocalAuthResult {
  user: UserRecord;
  loginType?: LoginType;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearer(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const localUser = this.tryLocalJwt(token);
    if (localUser) {
      request.currentUser = localUser.user;
      request.loginType = localUser.loginType;
      return true;
    }

    try {
      const supabaseUser = await this.supabaseService.getUserFromToken(token);
      if (supabaseUser?.email) {
        request.currentUser = fromSupabaseUser(supabaseUser);
        request.loginType = 'email';
        return true;
      }
    } catch (error) {
      // Swallow to throw generic unauthorized below
    }

    throw new UnauthorizedException('Unauthorized');
  }

  private extractBearer(authHeader?: string | string[]): string | null {
    if (!authHeader) return null;
    const value = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const [scheme, token] = value.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }
    return token;
  }

  private tryLocalJwt(token: string): LocalAuthResult | null {
    try {
      const payload = this.jwtTokenService.verifyAccessToken(token);
      if (payload?.sub && payload?.email) {
        const issuedAt = payload.iat ? new Date(payload.iat * 1000) : new Date();
        const user: UserRecord = {
          id: payload.sub,
          email: payload.email,
          name: payload.name ?? null,
          avatar_url: null,
          username: payload.email.split('@')[0] || payload.sub,
          password_hash: '',
          created_at: issuedAt,
          updated_at: issuedAt,
        };
        return { user, loginType: payload.loginType };
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
