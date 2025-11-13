import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller';
import { AuthModule } from '../auth/auth.module';
import { SocialAuthService } from './social-auth.service';

@Module({
  imports: [AuthModule],
  controllers: [OAuthController],
  providers: [SocialAuthService],
})
export class OAuthModule {}
