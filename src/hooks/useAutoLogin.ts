// hooks/useAutoLogin.ts
import { useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export type ServerUser = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  // any other fields from server
};

export type UserProfile = {
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSave: boolean;
    defaultModel: string;
  };
  _id?: string;
  role?: string;
  createdAt?: string;
};

function mapServerUserToUserProfile(serverUser: ServerUser | null): UserProfile | null {
  if (!serverUser) return null;
  return {
    name: serverUser.name,
    email: serverUser.email,
    avatar: undefined,
    preferences: {
      theme: 'system',
      notifications: true,
      autoSave: true,
      defaultModel: 'qwen:4b'
    },
    _id: serverUser._id,
    role: serverUser.role,
    createdAt: serverUser.createdAt
  };
}

/**
 * useAutoLogin
 * - onSuccess: callback(userProfile) when token + user are validated
 * - onFailure: optional callback when validation fails
 */
export function useAutoLogin(onSuccess: (u: UserProfile) => void, onFailure?: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('qc_token');
    const rawUser = localStorage.getItem('qc_user');

    if (!token || !rawUser) {
      // nothing to validate
      if (onFailure) onFailure();
      return;
    }

    let parsedUser: unknown;
    try {
      parsedUser = JSON.parse(rawUser);
    } catch (err) {
      // invalid cached user: clean
      localStorage.removeItem('qc_user');
      localStorage.removeItem('qc_token');
      if (onFailure) onFailure();
      return;
    }

    // Validate token by calling server
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          // token invalid or expired: clear local storage
          localStorage.removeItem('qc_user');
          localStorage.removeItem('qc_token');
          if (onFailure) onFailure();
          return;
        }

        const body = await res.json();
        const serverUser: ServerUser | undefined = body?.user;
        if (!serverUser) {
          localStorage.removeItem('qc_user');
          localStorage.removeItem('qc_token');
          if (onFailure) onFailure();
          return;
        }

        // Save up-to-date user in localStorage (optional)
        localStorage.setItem('qc_user', JSON.stringify(serverUser));

        // Map and call success handler
        const profile = mapServerUserToUserProfile(serverUser)!;
        onSuccess(profile);
      } catch (err) {
        // network or other error — do not log user in automatically
        console.error('[useAutoLogin] validation error', err);
        if (onFailure) onFailure();
      }
    })();
  }, []);
}
