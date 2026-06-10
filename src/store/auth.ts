import { create } from "zustand";

/**
 * Session state — intentionally separate from the workspace store so the
 * persisted progress contract stays byte-identical. Never persisted; the
 * Supabase client owns the durable session (cookies).
 */
export type AuthStatus = "unknown" | "signedOut" | "signedIn";

interface AuthStore {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  setSession: (userId: string | null, email: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: "unknown",
  userId: null,
  email: null,
  setSession: (userId, email) => set({ status: userId ? "signedIn" : "signedOut", userId, email }),
}));
