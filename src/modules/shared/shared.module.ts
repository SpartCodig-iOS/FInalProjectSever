import { Global, Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { JwtTokenService } from '../../services/jwtService';
import { SessionService } from '../../services/sessionService';
import { SupabaseService } from '../../services/supabaseService';
import { OAuthStateService } from '../../services/oauthStateService';

@Global()
@Module({
  providers: [SupabaseService, JwtTokenService, SessionService, AuthGuard, OAuthStateService],
  exports: [SupabaseService, JwtTokenService, SessionService, AuthGuard, OAuthStateService],
})
export class SharedModule {}
