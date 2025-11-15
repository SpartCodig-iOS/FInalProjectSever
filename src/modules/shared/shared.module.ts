import { Global, Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { JwtTokenService } from '../../services/jwtService';
import { OptimizedJwtTokenService } from '../../services/optimized-jwt.service';
import { SupabaseService } from '../../services/supabaseService';
import { SessionService } from '../../services/sessionService';
import { RateLimitService } from '../../services/rateLimitService';
import { SmartCacheService } from '../../services/smart-cache.service';
import { CacheService } from '../../services/cacheService';

@Global()
@Module({
  providers: [
    CacheService,
    SupabaseService,
    JwtTokenService,
    OptimizedJwtTokenService,
    SmartCacheService,
    SessionService,
    RateLimitService,
    AuthGuard,
    RateLimitGuard,
  ],
  exports: [
    CacheService,
    SupabaseService,
    JwtTokenService,
    OptimizedJwtTokenService,
    SmartCacheService,
    SessionService,
    RateLimitService,
    AuthGuard,
    RateLimitGuard,
  ],
})
export class SharedModule {}
