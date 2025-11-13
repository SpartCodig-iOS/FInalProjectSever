"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let SessionService = class SessionService {
    constructor() {
        this.sessions = new Map();
    }
    generateSessionId() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    createSession(user, loginType, ttlMinutes = 1440) {
        const sessionId = this.generateSessionId();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
        const sessionData = {
            sessionId,
            userId: user.id,
            email: user.email,
            name: user.name,
            loginType,
            lastLoginAt: now.toISOString(),
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        };
        this.sessions.set(sessionId, sessionData);
        return sessionData;
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        if (new Date() > new Date(session.expiresAt)) {
            this.sessions.delete(sessionId);
            return null;
        }
        return session;
    }
    updateSessionLastLogin(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        if (new Date() > new Date(session.expiresAt)) {
            this.sessions.delete(sessionId);
            return null;
        }
        session.lastLoginAt = new Date().toISOString();
        this.sessions.set(sessionId, session);
        return session;
    }
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    deleteUserSessions(userId) {
        let deleted = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                this.sessions.delete(sessionId);
                deleted++;
            }
        }
        return deleted;
    }
    cleanExpiredSessions() {
        const now = new Date();
        let cleaned = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > new Date(session.expiresAt)) {
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }
        return cleaned;
    }
    getActiveSessionCount() {
        return this.sessions.size;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)()
], SessionService);
