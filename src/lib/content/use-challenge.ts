"use client";

import { useEffect, useState } from "react";
import type { Challenge } from "./schema";

/**
 * Client-side challenge-body cache. List views carry metadata only; the full
 * body is fetched once per challenge from /api/challenges/[id] (server-
 * validated; statically generated). A server-rendered page can seed the cache
 * via `initial` (the /challenge/[id] permalink does, for SEO).
 */
const cache = new Map<string, Challenge>();

export interface ChallengeLoad {
  challenge: Challenge | null;
  failed: boolean;
}

export function useChallenge(id: string, initial?: Challenge | null): ChallengeLoad {
  if (initial && !cache.has(initial.id)) {
    cache.set(initial.id, initial);
  }

  const [state, setState] = useState<ChallengeLoad>(() => ({
    challenge: cache.get(id) ?? null,
    failed: false,
  }));

  useEffect(() => {
    const cached = cache.get(id);
    if (cached) {
      setState({ challenge: cached, failed: false });
      return;
    }
    let cancelled = false;
    setState({ challenge: null, failed: false });
    fetch(`/api/challenges/${encodeURIComponent(id)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json() as Promise<Challenge>;
      })
      .then((challenge) => {
        cache.set(id, challenge);
        if (!cancelled) setState({ challenge, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ challenge: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
