"use client";

import { useEffect, useRef } from "react";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import { useAuthStore } from "@/store/auth";
import { useWorkspaceStore } from "@/store/workspace";

const PROGRESS_STORAGE_KEY = "jupyter-arena-progress-v1";

/**
 * Bootstraps the Supabase session after hydration (lazy import keeps
 * supabase-js out of the initial bundle) and owns the sign-in side effects:
 * one-time local→account merge, store hydration from the account, and the
 * reset back to anonymous state on sign-out. Renders nothing.
 */
export function AuthProvider() {
  const setSession = useAuthStore((s) => s.setSession);
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!publicSupabaseEnv()) {
      setSession(null, null);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function syncAccount(userId: string) {
      if (hydratedFor.current === userId) return;
      hydratedFor.current = userId;

      const { collectMergeItems, fetchAccountState, mergeLocalProgress } =
        await import("@/lib/game/server-progress");
      let account = await fetchAccountState();

      if (!account.merged) {
        const items = collectMergeItems(useWorkspaceStore.getState().attempts);
        if (items.length > 0) {
          try {
            await mergeLocalProgress(items);
            account = await fetchAccountState();
          } catch {
            // already_merged on another device/tab — the fresh fetch below wins.
            account = await fetchAccountState();
          }
          // The progress now lives in the account; a stale anonymous copy
          // would resurrect on sign-out.
          window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
        }
      }

      if (cancelled) return;
      useWorkspaceStore.getState().hydrateFromServer(
        account.stats,
        account.progress.map((row) => ({
          challengeId: row.challenge_id,
          attempts: row.attempts,
          hintsUsed: row.hints_used,
          solved: row.solved_at !== null,
        })),
        account.extras,
      );
    }

    void (async () => {
      const { getBrowserClient } = await import("@/lib/supabase/client");
      const client = getBrowserClient();
      if (!client || cancelled) {
        setSession(null, null);
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();
      if (cancelled) return;
      setSession(session?.user.id ?? null, session?.user.email ?? null);
      if (session?.user) void syncAccount(session.user.id);

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession?.user.id ?? null, nextSession?.user.email ?? null);
        if (nextSession?.user) {
          void syncAccount(nextSession.user.id);
        } else if (hydratedFor.current) {
          hydratedFor.current = null;
          useWorkspaceStore.getState().resetProgress();
          void useWorkspaceStore.persist.rehydrate();
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [setSession]);

  return null;
}
