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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sessionService_1 = require("../../services/sessionService");
const jwtService_1 = require("../../services/jwtService");
const supabaseService_1 = require("../../services/supabaseService");
const mappers_1 = require("../../utils/mappers");
let AuthService = class AuthService {
    constructor(supabaseService, jwtTokenService, sessionService) {
        this.supabaseService = supabaseService;
        this.jwtTokenService = jwtTokenService;
        this.sessionService = sessionService;
    }
    buildAuthSession(user, loginType) {
        const tokenPair = this.jwtTokenService.generateTokenPair(user, loginType);
        const session = this.sessionService.createSession(user, loginType);
        return { user, tokenPair, session, loginType };
    }
    async signup(input) {
        const lowerEmail = input.email.toLowerCase();
        const supabaseUser = await this.supabaseService.signUp(lowerEmail, input.password, {
            name: input.name,
        });
        if (!supabaseUser) {
            throw new common_1.InternalServerErrorException('Supabase createUser did not return a user');
        }
        const username = (lowerEmail.split('@')[0] || `user_${supabaseUser.id.substring(0, 8)}`).toLowerCase();
        const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        const newUser = {
            id: supabaseUser.id,
            email: lowerEmail,
            name: input.name ?? null,
            avatar_url: null,
            created_at: new Date(),
            updated_at: new Date(),
            username,
            password_hash: passwordHash,
        };
        return this.buildAuthSession(newUser, 'signup');
    }
    async login(input) {
        const identifier = input.identifier.trim().toLowerCase();
        if (!identifier) {
            throw new common_1.UnauthorizedException('email and password are required');
        }
        let emailToUse = identifier;
        let loginType = 'email';
        if (!identifier.includes('@')) {
            let profile;
            try {
                profile = await this.supabaseService.findProfileByIdentifier(identifier);
            }
            catch (error) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            if (!profile?.email) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            emailToUse = profile.email.toLowerCase();
        }
        let supabaseUser;
        try {
            supabaseUser = await this.supabaseService.signIn(emailToUse, input.password);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const user = (0, mappers_1.fromSupabaseUser)(supabaseUser);
        return this.buildAuthSession(user, loginType);
    }
    async refresh(refreshToken) {
        const payload = this.jwtTokenService.verifyRefreshToken(refreshToken);
        if (!payload.sub) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        let user;
        try {
            const supabaseUser = await this.supabaseService.getUserById(payload.sub);
            if (!supabaseUser) {
                throw new common_1.UnauthorizedException('User not found in Supabase');
            }
            user = (0, mappers_1.fromSupabaseUser)(supabaseUser);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('User verification failed');
        }
        const tokenPair = this.jwtTokenService.generateTokenPair(user, 'email');
        const session = this.sessionService.createSession(user, 'email');
        return { tokenPair, session };
    }
    async deleteAccount(user) {
        let supabaseDeleted = false;
        try {
            await this.supabaseService.deleteUser(user.id);
            supabaseDeleted = true;
        }
        catch (error) {
            const message = error?.message?.toLowerCase() ?? '';
            if (!message.includes('not found')) {
                throw error;
            }
        }
        return { supabaseDeleted };
    }
    async loginWithSupabaseCode(code) {
        const session = await this.supabaseService.exchangeCodeForSession(code);
        if (!session.user) {
            throw new common_1.UnauthorizedException('Supabase session does not include a user');
        }
        const user = (0, mappers_1.fromSupabaseUser)(session.user);
        return this.buildAuthSession(user, 'apple');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabaseService_1.SupabaseService,
        jwtService_1.JwtTokenService,
        sessionService_1.SessionService])
], AuthService);
