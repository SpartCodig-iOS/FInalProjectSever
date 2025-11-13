import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

interface StoredState {
  codeVerifier: string;
  clientState?: string;
  createdAt: number;
}

@Injectable()
export class OAuthStateService {
  private readonly states = new Map<string, StoredState>();
  private readonly ttlMs = 5 * 60 * 1000; // 5분

  generateState(clientState?: string): { stateId: string; codeChallenge: string } {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const stateId = randomBytes(16).toString('hex');

    this.states.set(stateId, {
      codeVerifier,
      clientState,
      createdAt: Date.now(),
    });

    return { stateId, codeChallenge };
  }

  consumeState(stateId: string | null | undefined): StoredState | null {
    if (!stateId) return null;
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

  private generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(codeVerifier: string): string {
    return createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
