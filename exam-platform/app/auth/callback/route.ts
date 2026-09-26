import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Google redirects here after login. Exchange the auth code for a session,
// then make sure a matching row exists in `teachers` (id = auth.users.id).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;
    if (user) {
      await supabase.from("teachers").upsert(
        {
          id: user.id,
          email: user.email!,
          display_name: user.user_metadata?.full_name ?? user.email,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
        { onConflict: "id" }
      );
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}