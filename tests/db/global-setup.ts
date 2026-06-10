import { createClient } from "@supabase/supabase-js";
import { seedContent } from "../../scripts/seed-content";

/** Seeds /content once before the suite so every test sees published rows. */
export default async function globalSetup(): Promise<void> {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.API_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("DB integration tests need Supabase env — see tests/db/helpers.ts");
  }
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  await seedContent(admin);
}
