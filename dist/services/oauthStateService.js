"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthStateService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let OAuthStateService = class OAuthStateService {
    constructor() {
        this.states = new Map();
        this.ttlMs = 5 * 60 * 1000; // 5분
    }
    generateState(clientState) {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(codeVerifier);
        const stateId = (0, crypto_1.randomBytes)(16).toString('hex');
        this.states.set(stateId, {
            codeVerifier,
            clientState,
            createdAt: Date.now(),
        });
        return { stateId, codeChallenge };
    }
    consumeState(stateId) {
        if (!stateId)
            return null;
        const stored = this.states.get(stateId);
        if (!stored) {
            return null;
        }
        if (Date.now() - stored.createdAt > this.ttlMs) {
            this.states.delete(stateId);
            return null;
        }
        this.states.delete(stateId);
        return stored;
    }
    generateCodeVerifier() {
        return (0, crypto_1.randomBytes)(32).toString('base64url');
    }
    generateCodeChallenge(codeVerifier) {
        return (0, crypto_1.createHash)('sha256')
            .update(codeVerifier)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
};
exports.OAuthStateService = OAuthStateService;
exports.OAuthStateService = OAuthStateService = __decorate([
    (0, common_1.Injectable)()
], OAuthStateService);
