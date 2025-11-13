import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { LoginType } from '../../types/auth';
import { UserRecord } from '../../types/user';
import { LoginInput, SignupInput } from '../../validators/authSchemas';
import { SessionData, SessionService } from '../../services/sessionService';
import { JwtTokenService, TokenPair } from '../../services/jwtService';
import { SupabaseService } from '../../services/supabaseService';
import { fromSupabaseUser } from '../../utils/mappers';

interface AuthSessionPayload {
  user: UserRecord;
  tokenPair: TokenPair;
  session: SessionData;
  loginType: LoginType;
}

interface RefreshPayload {
  tokenPair: TokenPair;
  session: SessionData;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly sessionService: SessionService,
  ) {}

  private buildAuthSession(user: UserRecord, loginType: LoginType): AuthSessionPayload {
    const tokenPair = this.jwtTokenService.generateTokenPair(user, loginType);
    const session = this.sessionService.createSession(user, loginType);
    return { user, tokenPair, session, loginType };
  }

  async signup(input: SignupInput): Promise<AuthSessionPayload> {
    const lowerEmail = input.email.toLowerCase();
    const supabaseUser = await this.supabaseService.signUp(lowerEmail, input.password, {
      name: input.name,
    });

    if (!supabaseUser) {
      throw new InternalServerErrorException('Supabase createUser did not return a user');
    }

    const username = (lowerEmail.split('@')[0] || `user_${supabaseUser.id.substring(0, 8)}`).toLowerCase();
    const passwordHash = await bcrypt.hash(input.password, 10);

    const newUser: UserRecord = {
      id: supabaseUser.id,
      email: lowerEmail,
      name: input.name ?? null,
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
      username,
      password_hash: passwordHash,
    };

    return this.buildAuthSession(newUser, 'signup');
  }

  async login(input: LoginInput): Promise<AuthSessionPayload> {
    const identifier = input.identifier.trim().toLowerCase();
    if (!identifier) {
      throw new UnauthorizedException('email and password are required');
    }
    let emailToUse = identifier;
    let loginType: LoginType = 'email';

    if (!identifier.includes('@')) {
      let profile;
      try {
        profile = await this.supabaseService.findProfileByIdentifier(identifier);
      } catch (error) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (!profile?.email) {
        throw new UnauthorizedException('Invalid credentials');
      }
      emailToUse = profile.email.toLowerCase();
    }

    let supabaseUser;
    try {
      supabaseUser = await this.supabaseService.signIn(emailToUse, input.password);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = fromSupabaseUser(supabaseUser);

    return this.buildAuthSession(user, loginType);
  }

  async refresh(refreshToken: string): Promise<RefreshPayload> {
    const payload = this.jwtTokenService.verifyRefreshToken(refreshToken);
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let user: UserRecord;
    try {
      const supabaseUser = await this.supabaseService.getUserById(payload.sub);
      if (!supabaseUser) {
        throw new UnauthorizedException('User not found in Supabase');
      }
      user = fromSupabaseUser(supabaseUser);
    } catch (error) {
      throw new UnauthorizedException('User verification failed');
    }

    const tokenPair = this.jwtTokenService.generateTokenPair(user, 'email');
    const session = this.sessionService.createSession(user, 'email');

    return { tokenPair, session };
  }

  async deleteAccount(user: UserRecord): Promise<{ supabaseDeleted: boolean }> {
    let supabaseDeleted = false;
    try {
      await this.supabaseService.deleteUser(user.id);
      supabaseDeleted = true;
    } catch (error: any) {
      const message = (error?.message as string)?.toLowerCase() ?? '';
      if (!message.includes('not found')) {
        throw error;
      }
    }

    return { supabaseDeleted };
  }

  async loginWithSupabaseCode(code: string, codeVerifier: string): Promise<AuthSessionPayload> {
    const session = await this.supabaseService.exchangeCodeForSession(code, codeVerifier);
    if (!session.user) {
      throw new UnauthorizedException('Supabase session does not include a user');
    }
    const user = fromSupabaseUser(session.user);
    return this.buildAuthSession(user, 'apple');
  }
}
