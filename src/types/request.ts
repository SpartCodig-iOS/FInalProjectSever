import { Request } from 'express';
import { LoginType } from './auth';
import { UserRecord } from './user';

export interface RequestWithUser extends Request {
  currentUser?: UserRecord;
  loginType?: LoginType;
}
