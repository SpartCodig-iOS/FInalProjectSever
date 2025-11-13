import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginType } from '../../types/auth';
import { SupabaseService } from '../../services/supabaseService';
import { AuthService, AuthSessionPayload } from '../auth/auth.service';
import { fromSupabaseUser } from '../../utils/mappers';

export interface SocialLookupResult {
  registered: boolean;
}

@Injectable()
export class SocialAuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async loginWithOAuthToken(accessToken: string, loginType: LoginType = 'email'): Promise<AuthSessionPayload> {
    if (!accessToken) {
      throw new UnauthorizedException('Missing Supabase access token');
    }
    const supabaseUser = await this.supabaseService.getUserFromToken(accessToken);
    if (!supabaseUser) {
      throw new UnauthorizedException('Invalid Supabase access token');
    }
    await this.supabaseService.ensureProfileFromSupabaseUser(supabaseUser, loginType);
    const preferDisplayName = loginType !== 'email' && loginType !== 'username';
    const user = fromSupabaseUser(supabaseUser, { preferDisplayName });
    return this.authService.createAuthSession(user, loginType);
  }

  async checkOAuthAccount(
    accessToken: string,
    loginType: LoginType = 'email',
  ): Promise<SocialLookupResult> {
    if (!accessToken) {
      throw new UnauthorizedException('Missing Supabase access token');
    }
    const supabaseUser = await this.supabaseService.getUserFromToken(accessToken);
    if (!supabaseUser || !supabaseUser.id || !supabaseUser.email) {
      throw new UnauthorizedException('Invalid Supabase access token');
    }

    const profile = await this.supabaseService.findProfileById(supabaseUser.id);
    return { registered: Boolean(profile) };
  }
}
