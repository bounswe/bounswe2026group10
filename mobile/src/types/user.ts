import type { ISODateString, UserRole } from './common';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  region: string;
  preferredLanguage: string;
  profilePictureUrl?: string;
  bio?: string;
  memberSince: ISODateString;
}
