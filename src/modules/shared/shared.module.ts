import { Global, Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { JwtTokenService } from '../../services/jwtService';
import { SessionService } from '../../services/sessionService';
import { SupabaseService } from '../../services/supabaseService';

@Global()
@Module({
  providers: [SupabaseService, JwtTokenService, SessionService, AuthGuard],
  exports: [SupabaseService, JwtTokenService, SessionService, AuthGuard],
})
export class SharedModule {}
