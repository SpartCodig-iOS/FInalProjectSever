import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CacheService } from '../../services/cacheService';
import { SupabaseService } from '../../services/supabaseService';

@Module({
  controllers: [HealthController],
  providers: [CacheService, SupabaseService],
})
export class HealthModule {}
