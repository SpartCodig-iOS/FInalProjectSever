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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwtService_1 = require("../../services/jwtService");
const supabaseService_1 = require("../../services/supabaseService");
const mappers_1 = require("../../utils/mappers");
let AuthGuard = class AuthGuard {
    constructor(jwtTokenService, supabaseService) {
        this.jwtTokenService = jwtTokenService;
        this.supabaseService = supabaseService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractBearer(request.headers.authorization);
        if (!token) {
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        const localUser = this.tryLocalJwt(token);
        if (localUser) {
            request.currentUser = localUser.user;
            request.loginType = localUser.loginType;
            return true;
        }
        try {
            const supabaseUser = await this.supabaseService.getUserFromToken(token);
            if (supabaseUser?.email) {
                request.currentUser = (0, mappers_1.fromSupabaseUser)(supabaseUser);
                request.loginType = 'email';
                return true;
            }
        }
        catch (error) {
            // Swallow to throw generic unauthorized below
        }
        throw new common_1.UnauthorizedException('Unauthorized');
    }
    extractBearer(authHeader) {
        if (!authHeader)
            return null;
        const value = Array.isArray(authHeader) ? authHeader[0] : authHeader;
        const [scheme, token] = value.split(' ');
        if (scheme?.toLowerCase() !== 'bearer' || !token) {
            return null;
        }
        return token;
    }
    tryLocalJwt(token) {
        try {
            const payload = this.jwtTokenService.verifyAccessToken(token);
            if (payload?.sub && payload?.email) {
                const issuedAt = payload.iat ? new Date(payload.iat * 1000) : new Date();
                const user = {
                    id: payload.sub,
                    email: payload.email,
                    name: payload.name ?? null,
                    avatar_url: null,
                    username: payload.email.split('@')[0] || payload.sub,
                    password_hash: '',
                    created_at: issuedAt,
                    updated_at: issuedAt,
                };
                return { user, loginType: payload.loginType };
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwtService_1.JwtTokenService,
        supabaseService_1.SupabaseService])
], AuthGuard);
