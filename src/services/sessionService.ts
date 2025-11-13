import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { LoginType } from '../types/auth';
import { UserRecord } from '../types/user';

export interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  name?: string | null;
  loginType: LoginType;
  lastLoginAt: string;
  createdAt: string;
  expiresAt: string;
}

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, SessionData>();

  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  createSession(user: UserRecord, loginType: LoginType, ttlMinutes = 1440): SessionData {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const sessionData: SessionData = {
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

  getSession(sessionId: string): SessionData | null {
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

  updateSessionLastLogin(sessionId: string): SessionData | null {
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

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  deleteUserSessions(userId: string): number {
    let deleted = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        deleted++;
      }
    }
    return deleted;
  }

  cleanExpiredSessions(): number {
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

  getActiveSessionCount(): number {
    return this.sessions.size;
  }
}
