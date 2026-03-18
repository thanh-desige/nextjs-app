// ============================================================
// User Types — DB table: user
// ============================================================

export type AuthProvider = 'email' | 'google' | 'facebook' | 'apple';
export type UserStatus = 'active' | 'suspended' | 'deleted';

/** DB table: user (global account) */
export interface User {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  emailVerified: boolean;
  mfaEnabled: boolean;
  status: UserStatus;
  createdAt: string;
}
