import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { success } from '../../types/api';
import { SupabaseService } from '../../services/supabaseService';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    const database = await this.supabaseService.checkProfilesHealth();

    return success({
      status: 'ok',
      database,
    });
  }
}
