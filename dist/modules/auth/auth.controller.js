"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const api_1 = require("../../types/api");
const authSchemas_1 = require("../../validators/authSchemas");
const mappers_1 = require("../../utils/mappers");
const auth_guard_1 = require("../../common/guards/auth.guard");
const env_1 = require("../../config/env");
const auth_response_dto_1 = require("./dto/auth-response.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    buildAuthSuccessResponse(result, message) {
        return (0, api_1.success)({
            user: (0, mappers_1.toUserResponse)(result.user),
            accessToken: result.tokenPair.accessToken,
            refreshToken: result.tokenPair.refreshToken,
            accessTokenExpiresAt: result.tokenPair.accessTokenExpiresAt.toISOString(),
            refreshTokenExpiresAt: result.tokenPair.refreshTokenExpiresAt.toISOString(),
            sessionId: result.session.sessionId,
            sessionExpiresAt: result.session.expiresAt,
            lastLoginAt: result.session.lastLoginAt,
        }, message);
    }
    buildSupabaseAppleUrl(redirectTo, state) {
        const base = new URL(`${env_1.env.supabaseUrl}/auth/v1/authorize`);
        base.searchParams.set('provider', 'apple');
        if (redirectTo) {
            base.searchParams.set('redirect_to', redirectTo);
        }
        if (state) {
            base.searchParams.set('state', state);
        }
        return base.toString();
    }
    async signup(body) {
        const payload = authSchemas_1.signupSchema.parse(body);
        const result = await this.authService.signup(payload);
        return this.buildAuthSuccessResponse(result, 'Signup successful');
    }
    async login(body) {
        const payload = authSchemas_1.loginSchema.parse(body);
        const result = await this.authService.login(payload);
        return this.buildAuthSuccessResponse(result, 'Login successful');
    }
    async refresh(body) {
        const payload = authSchemas_1.refreshSchema.parse(body);
        const result = await this.authService.refresh(payload.refreshToken);
        return (0, api_1.success)({
            accessToken: result.tokenPair.accessToken,
            refreshToken: result.tokenPair.refreshToken,
            accessTokenExpiresAt: result.tokenPair.accessTokenExpiresAt.toISOString(),
            refreshTokenExpiresAt: result.tokenPair.refreshTokenExpiresAt.toISOString(),
            sessionId: result.session.sessionId,
            sessionExpiresAt: result.session.expiresAt,
        }, 'Token refreshed successfully');
    }
    async appleAuthorize(redirectTo, state, mode, res) {
        const url = this.buildSupabaseAppleUrl(redirectTo, state);
        if (mode === 'redirect' && res) {
            res.redirect(url);
            return;
        }
        return (0, api_1.success)({ url }, 'Apple authorization URL');
    }
    async appleCallback(code, state) {
        if (!code) {
            throw new common_1.BadRequestException('Missing authorization code');
        }
        const result = await this.authService.loginWithSupabaseCode(code);
        const response = this.buildAuthSuccessResponse(result, 'Apple login successful');
        if (state) {
            response.data.state = state;
        }
        return response;
    }
    async appleCallbackFromClient(body) {
        if (!body.code) {
            throw new common_1.BadRequestException('Missing authorization code');
        }
        const result = await this.authService.loginWithSupabaseCode(body.code);
        const response = this.buildAuthSuccessResponse(result, 'Apple login successful');
        if (body.state) {
            response.data.state = body.state;
        }
        return response;
    }
    async deleteAccount(req) {
        const currentUser = req.currentUser;
        if (!currentUser) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        const result = await this.authService.deleteAccount(currentUser);
        return (0, api_1.success)({
            userID: currentUser.id,
            supabaseDeleted: result.supabaseDeleted,
        }, 'Account deleted successfully');
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '사용자 회원가입' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: { type: 'string', format: 'email', example: 'string' },
                password: { type: 'string', minLength: 6, example: 'string' },
                name: { type: 'string', example: 'string' },
            },
        },
    }),
    (0, swagger_1.ApiOkResponse)({ type: auth_response_dto_1.SignupResponseDto }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: '잘못된 요청 본문',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'integer', example: 400 },
                message: { type: 'string', example: 'email and password are required' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '로그인 (이메일 또는 아이디)' }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiOkResponse)({ type: auth_response_dto_1.LoginResponseDto }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: '이메일/패스워드 누락',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'integer', example: 400 },
                message: { type: 'string', example: 'email and password are required' },
            },
        },
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: '자격 증명 오류',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'integer', example: 401 },
                message: { type: 'string', example: 'Invalid credentials' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh 토큰으로 Access 토큰 재발급' }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiOkResponse)({ type: auth_response_dto_1.RefreshResponseDto }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Refresh 토큰 누락',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'integer', example: 400 },
                message: { type: 'string', example: 'refreshToken is required' },
            },
        },
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Refresh 토큰 검증 실패',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'integer', example: 401 },
                message: { type: 'string', example: 'Invalid or expired refresh token' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('apple'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '애플 로그인 URL 반환/리다이렉트 (Supabase OAuth)' }),
    (0, swagger_1.ApiQuery)({ name: 'redirectTo', required: false, description: '완료 후 돌아갈 URL (redirect_to)' }),
    (0, swagger_1.ApiQuery)({ name: 'state', required: false }),
    (0, swagger_1.ApiQuery)({
        name: 'mode',
        required: false,
        description: 'redirect 지정 시 서버가 즉시 애플 로그인 페이지로 리다이렉트',
    }),
    __param(0, (0, common_1.Query)('redirectTo')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Query)('mode')),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "appleAuthorize", null);
__decorate([
    (0, common_1.Get)('apple/callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '애플 로그인 콜백 처리 (Supabase OAuth code)' }),
    (0, swagger_1.ApiQuery)({ name: 'code', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'state', required: false }),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "appleCallback", null);
__decorate([
    (0, common_1.Post)('apple/callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '애플 OAuth code를 서버에 전달하여 JWT 발급' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['code'],
            properties: {
                code: { type: 'string', example: 'oauth-code-from-supabase' },
                state: { type: 'string', example: 'client-state', nullable: true },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "appleCallbackFromClient", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '본인 계정 삭제 (Supabase 계정 포함)' }),
    (0, swagger_1.ApiOkResponse)({ type: auth_response_dto_1.DeleteAccountResponseDto }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: '인증 실패',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'integer', example: 401 },
                message: { type: 'string', example: 'Unauthorized' },
            },
        },
    }),
    (0, common_1.Delete)('account'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteAccount", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('api/v1/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
