// components/auth/AuthProviderClient.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// If you already created useAutoLogin from earlier message, import it.
// Otherwise I included a tiny inline validateToken function below for completeness.
import { useAutoLogin as useProvidedAutoLogin, UserProfile as ProvidedUserProfile } from '@/hooks/useAutoLogin';

type UserProfile = ProvidedUserProfile | null;

interface AuthContextShape {
  user: UserProfile;
  loading: boolean;
  login: (token: string, userObj: object) => void; // quick client login (sets localStorage + context)
  logout: () => void;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * If you already implemented useAutoLogin in /hooks/useAutoLogin, this provider will call it.
 * If not, the internal validateToken() function below will call /api/auth/me directly.
 */
export default function AuthProviderClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);

  // If you have the hook we discussed earlier, prefer that:
  // useProvidedAutoLogin(
  //   (profile) => { setUser(profile); setLoading(false); },
  //   () => { setUser(null); setLoading(false); }
  // );

  // Minimal inline validation (equivalent of useAutoLogin)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('qc_token');
      const rawUser = localStorage.getItem('qc_user');

      if (!token || !rawUser) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Try parsing cached user (we'll still validate token with server)
      try {
        const parsed = JSON.parse(rawUser);
        // optimistic set while verifying (optional)
        if (mounted) setUser({
          ...(parsed as object),
          preferences: (parsed as any).preferences ?? {
            theme: 'system',
            notifications: true,
            autoSave: true,
            defaultModel: 'qwen:4b'
          }
        } as any);
      } catch {
        localStorage.removeItem('qc_user');
        localStorage.removeItem('qc_token');
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('qc_token')}`
          }
        });

        if (!res.ok) {
          // invalid token
          localStorage.removeItem('qc_user');
          localStorage.removeItem('qc_token');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const body = await res.json();
        const serverUser = body?.user;
        if (!serverUser) {
          localStorage.removeItem('qc_user');
          localStorage.removeItem('qc_token');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Normalize to your app UserProfile shape (minimal)
        const mapped = {
          name: serverUser.name,
          email: serverUser.email,
          avatar: (serverUser as any).avatar,
          preferences: {
            theme: 'system',
            notifications: true,
            autoSave: true,
            defaultModel: (serverUser as any).defaultModel || 'qwen:4b'
          },
          _id: serverUser._id,
          role: serverUser.role,
          createdAt: serverUser.createdAt
        } as any;

        localStorage.setItem('qc_user', JSON.stringify(serverUser)); // refresh cached user
        if (mounted) {
          setUser(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthProvider] token validation error', err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Call to log in: store token + user and set context
  const login = (token: string, userObj: object) => {
    localStorage.setItem('qc_token', token);
    localStorage.setItem('qc_user', JSON.stringify(userObj));
    setUser((prev) => ({
      ...((userObj as any) || {}),
      preferences: (userObj as any).preferences ?? {
        theme: 'system',
        notifications: true,
        autoSave: true,
        defaultModel: 'qwen:4b'
      }
    } as any));
  };

  const logout = () => {
    localStorage.removeItem('qc_token');
    localStorage.removeItem('qc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {/* While loading, you can render a global spinner or skeleton */}
      {loading ? (
        <div className="h-screen w-full flex items-center justify-center">
          <div className="text-sm opacity-80">Validating session…</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
