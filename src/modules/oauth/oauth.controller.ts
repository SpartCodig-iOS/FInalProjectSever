import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SocialAuthService } from './social-auth.service';
import { oauthTokenSchema } from '../../validators/authSchemas';
import { success } from '../../types/api';
import { LoginResponseDto } from '../auth/dto/auth-response.dto';
import { SocialLookupResponseDto } from './dto/oauth-response.dto';
import { buildAuthSessionResponse } from '../auth/auth-response.util';

@ApiTags('OAuth')
@Controller('api/v1/oauth')
export class OAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  private async handleOAuthLogin(body: unknown, message: string) {
    const payload = oauthTokenSchema.parse(body);
    const result = await this.socialAuthService.loginWithOAuthToken(payload.accessToken, payload.loginType);
    return success(buildAuthSessionResponse(result), message);
  }

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '소셜 OAuth 회원가입 (access token → 서버 JWT)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['accessToken'],
      properties: {
        accessToken: { type: 'string', description: 'Supabase access token (JWT)' },
        loginType: {
          type: 'string',
          description: '로그인 타입 (기본값 email)',
          example: 'apple',
          nullable: true,
        },
      },
    },
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'accessToken 누락',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 400 },
        message: { type: 'string', example: 'accessToken is required' },
      },
    },
  })
  async issueToken(@Body() body: unknown) {
    return this.handleOAuthLogin(body, 'Login successful');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '소셜/OAuth access token으로 로그인' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['accessToken'],
      properties: {
        accessToken: { type: 'string', description: 'Supabase access token (JWT)' },
        loginType: {
          type: 'string',
          description: '로그인 타입 (기본값 email)',
          example: 'apple',
          nullable: true,
        },
      },
    },
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'accessToken 누락',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 400 },
        message: { type: 'string', example: 'accessToken is required' },
      },
    },
  })
  async login(@Body() body: unknown) {
    return this.handleOAuthLogin(body, 'Login successful');
  }

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '소셜/OAuth access token으로 가입 여부 확인' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['accessToken'],
      properties: {
        accessToken: { type: 'string', description: 'Supabase access token (JWT)' },
        loginType: {
          type: 'string',
          description: '로그인 타입 (기본값 email)',
          example: 'apple',
          nullable: true,
        },
      },
    },
  })
  @ApiOkResponse({ type: SocialLookupResponseDto })
  @ApiBadRequestResponse({
    description: 'accessToken 누락',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 400 },
        message: { type: 'string', example: 'accessToken is required' },
      },
    },
  })
  async lookupOAuthAccount(@Body() body: unknown) {
    const payload = oauthTokenSchema.parse(body);
    const result = await this.socialAuthService.checkOAuthAccount(payload.accessToken, payload.loginType);
    return success(result, 'Lookup successful');
  }
}
