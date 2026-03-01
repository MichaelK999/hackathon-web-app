import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function NavBar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return (
    <nav className="flex w-full items-center justify-end gap-3 px-6 py-4">
      {user && (
        <Button asChild variant="outline" className="px-4 py-2 text-sm">
          <Link href="/skill-tree">Skill Tree</Link>
        </Button>
      )}
      <Button asChild className="px-5 py-2 text-sm">
        <Link href={user ? "/dashboard" : "/login"}>
          {user ? "Dashboard" : "Get Started"}
        </Link>
      </Button>
    </nav>
  );
}
