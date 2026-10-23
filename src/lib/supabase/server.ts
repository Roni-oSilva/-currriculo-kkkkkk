import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Cliente com a sessão do usuário (RLS aplicado). */
export async function createClient() {
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component: o middleware renova a sessão.
        }
      },
    },
  });
}
