import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Webhooks e exemplos públicos não precisam de sessão.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/examples|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
