import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { success } from '../../types/api';
import { loginSchema, refreshSchema, signupSchema } from '../../validators/authSchemas';
import { toUserResponse } from '../../utils/mappers';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequestWithUser } from '../../types/request';
import { env } from '../../config/env';
import { OAuthStateService } from '../../services/oauthStateService';
import {
  DeleteAccountResponseDto,
  LoginResponseDto,
  RefreshResponseDto,
  SignupResponseDto,
} from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthStateService: OAuthStateService,
  ) {}

  private buildAuthSuccessResponse(
    result: Awaited<ReturnType<AuthService['signup']>>,
    message: string,
  ) {
    return success(
      {
        user: toUserResponse(result.user),
        accessToken: result.tokenPair.accessToken,
        refreshToken: result.tokenPair.refreshToken,
        accessTokenExpiresAt: result.tokenPair.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: result.tokenPair.refreshTokenExpiresAt.toISOString(),
        sessionId: result.session.sessionId,
        sessionExpiresAt: result.session.expiresAt,
        lastLoginAt: result.session.lastLoginAt,
      },
      message,
    );
  }

  private buildSupabaseAppleUrl({
    redirectTo,
    state,
    codeChallenge,
  }: {
    redirectTo?: string;
    state?: string;
    codeChallenge?: string;
  }): string {
    const base = new URL(`${env.supabaseUrl}/auth/v1/authorize`);
    base.searchParams.set('provider', 'apple');
    base.searchParams.set('redirect_to', redirectTo ?? env.appleRedirectUri);
    if (state) {
      base.searchParams.set('state', state);
    }
    if (codeChallenge) {
      base.searchParams.set('code_challenge', codeChallenge);
      base.searchParams.set('code_challenge_method', 'S256');
    }
    return base.toString();
  }

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 회원가입' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'string' },
        password: { type: 'string', minLength: 6, example: 'string' },
        name: { type: 'string', example: 'string' },
      },
    },
  })
  @ApiOkResponse({ type: SignupResponseDto })
  @ApiBadRequestResponse({
    description: '잘못된 요청 본문',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 400 },
        message: { type: 'string', example: 'email and password are required' },
      },
    },
  })
  async signup(@Body() body: unknown) {
    const payload = signupSchema.parse(body);
    const result = await this.authService.signup(payload);

    return this.buildAuthSuccessResponse(result, 'Signup successful');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인 (이메일 또는 아이디)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['password'],
      properties: {
        identifier: {
          type: 'string',
          description: '이메일 전체 또는 @ 앞부분 아이디',
          example: 'string',
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'identifier 대신 email 사용 가능',
          example: 'string',
        },
        password: { type: 'string', example: 'string' },
      },
    },
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: '이메일/패스워드 누락',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 400 },
        message: { type: 'string', example: 'email and password are required' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '자격 증명 오류',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
      },
    },
  })
  async login(@Body() body: unknown) {
    const payload = loginSchema.parse(body);
    const result = await this.authService.login(payload);

    return this.buildAuthSuccessResponse(result, 'Login successful');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh 토큰으로 Access 토큰 재발급' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          example: 'string',
        },
      },
    },
  })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiBadRequestResponse({
    description: 'Refresh 토큰 누락',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 400 },
        message: { type: 'string', example: 'refreshToken is required' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh 토큰 검증 실패',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Invalid or expired refresh token' },
      },
    },
  })
  async refresh(@Body() body: unknown) {
    const payload = refreshSchema.parse(body);
    const result = await this.authService.refresh(payload.refreshToken);

    return success(
      {
        accessToken: result.tokenPair.accessToken,
        refreshToken: result.tokenPair.refreshToken,
        accessTokenExpiresAt: result.tokenPair.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: result.tokenPair.refreshTokenExpiresAt.toISOString(),
        sessionId: result.session.sessionId,
        sessionExpiresAt: result.session.expiresAt,
      },
      'Token refreshed successfully',
    );
  }

  @Get('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '애플 로그인 URL 반환/리다이렉트 (Supabase OAuth)' })
  @ApiQuery({ name: 'redirectTo', required: false, description: '완료 후 돌아갈 URL (redirect_to)' })
  @ApiQuery({ name: 'clientState', required: false, description: '클라이언트에서 전달할 state 값' })
  @ApiQuery({
    name: 'mode',
    required: false,
    description: 'redirect 지정 시 서버가 즉시 애플 로그인 페이지로 리다이렉트',
  })
  async appleAuthorize(
    @Query('redirectTo') redirectTo?: string,
    @Query('clientState') clientState?: string,
    @Query('mode') mode?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const { stateId, codeChallenge } = this.oauthStateService.generateState(clientState);
    const url = this.buildSupabaseAppleUrl({
      redirectTo,
      state: stateId,
      codeChallenge,
    });
    if (mode === 'redirect' && res) {
      res.redirect(url);
      return;
    }
    return success({ url }, 'Apple authorization URL');
  }

  @Get('apple/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '애플 로그인 콜백 처리 (Supabase OAuth code)' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: false })
  async appleCallback(@Query('code') code?: string, @Query('state') state?: string) {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }
    const stored = this.oauthStateService.consumeState(state);
    if (!stored) {
      throw new BadRequestException('Invalid or expired state');
    }
    const result = await this.authService.loginWithSupabaseCode(code, stored.codeVerifier);
    const response = this.buildAuthSuccessResponse(result, 'Apple login successful');
    if (stored.clientState) {
      (response.data as any).state = stored.clientState;
    }
    return response;
  }

  @Post('apple/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '애플 OAuth code를 서버에 전달하여 JWT 발급' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['code', 'codeVerifier'],
      properties: {
        code: { type: 'string', example: 'oauth-code-from-supabase' },
        codeVerifier: { type: 'string', example: 'generated-code-verifier' },
        state: { type: 'string', example: 'client-state', nullable: true },
      },
    },
  })
  async appleCallbackFromClient(@Body() body: { code?: string; codeVerifier?: string; state?: string }) {
    if (!body.code || !body.codeVerifier) {
      throw new BadRequestException('Missing authorization code or codeVerifier');
    }
    const result = await this.authService.loginWithSupabaseCode(body.code, body.codeVerifier);
    const response = this.buildAuthSuccessResponse(result, 'Apple login successful');
    if (body.state) {
      (response.data as any).state = body.state;
    }
    return response;
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '본인 계정 삭제 (Supabase 계정 포함)' })
  @ApiOkResponse({ type: DeleteAccountResponseDto })
  @ApiUnauthorizedResponse({
    description: '인증 실패',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Req() req: RequestWithUser) {
    const currentUser = req.currentUser;
    if (!currentUser) {
      throw new UnauthorizedException('Unauthorized');
    }

    const result = await this.authService.deleteAccount(currentUser);
    return success(
      {
        userID: currentUser.id,
        supabaseDeleted: result.supabaseDeleted,
      },
      'Account deleted successfully',
    );
  }
}
