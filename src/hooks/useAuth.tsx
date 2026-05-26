import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/db";
import { getMyProfile } from "@/services/profile";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;

  signIn: (email: string, password: string) => Promise<void>;

  signUp: (input: {
    email: string;
    password: string;
    full_name: string;
    business_name: string;
  }) => Promise<void>;

  signOut: () => Promise<void>;

  sendReset: (email: string) => Promise<void>;

  refreshProfile: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const loadProfile = useCallback(
    async (uid: string): Promise<void> => {
      try {
        for (let i = 0; i < 5; i++) {
          const p = await getMyProfile(uid).catch(
            () => null
          );

          if (p) {
            setProfile(p);
            return;
          }

          await new Promise((r) =>
            setTimeout(r, 350)
          );
        }

        setProfile(null);
      } catch (err) {
        console.error("PROFILE ERROR:", err);
        setProfile(null);
      }
    },
    []
  );

  useEffect(() => {
  let mounted = true;

  async function init() {
    try {
      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.error(error);
      }

      if (!mounted) return;

      const sess =
        data.session ?? null;

      setSession(sess);

      if (sess?.user?.id) {
        loadProfile(sess.user.id);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(
        "AUTH INIT ERROR:",
        err
      );
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }

  init();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);

      if (session?.user?.id) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    }
  );

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, [loadProfile]);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<void> => {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;
    },
    []
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      full_name: string;
      business_name: string;
    }): Promise<void> => {
      const { error } =
        await supabase.auth.signUp({
          email: input.email,
          password: input.password,

          options: {
            data: {
              full_name: input.full_name,
              business_name:
                input.business_name,
            },

            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/login`
                : undefined,
          },
        });

      if (error) throw error;
    },
    []
  );

  const signOut = useCallback(
    async (): Promise<void> => {
      await supabase.auth.signOut();
    },
    []
  );

  const sendReset = useCallback(
    async (email: string): Promise<void> => {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/login`
                : undefined,
          }
        );

      if (error) throw error;
    },
    []
  );

  const refreshProfile = useCallback(
    async (): Promise<void> => {
      if (session?.user?.id) {
        await loadProfile(session.user.id);
      }
    },
    [session?.user?.id, loadProfile]
  );

  const value = useMemo<AuthState>(
    () => ({
      session,

      user: session?.user ?? null,

      profile,

      loading,

      signIn,

      signUp,

      signOut,

      sendReset,

      refreshProfile,
    }),

    [
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      sendReset,
      refreshProfile,
    ]
  );

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}