-- 001_extensions — pgcrypto is enabled by default on Supabase; keep idempotent.
create extension if not exists pgcrypto;
