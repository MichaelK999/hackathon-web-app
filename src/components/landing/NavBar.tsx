import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function NavBar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return (
    <nav className="flex w-full items-center justify-between px-6 py-4">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3">
        {/* Pixel S logo */}
        <svg width="28" height="28" viewBox="0 0 16 16" className="pixel-render">
          <rect width="16" height="16" fill="#f97316" rx="0" />
          <rect x="4" y="2" width="8" height="2" fill="#fff" />
          <rect x="2" y="4" width="4" height="2" fill="#fff" />
          <rect x="4" y="6" width="8" height="2" fill="#fff" />
          <rect x="10" y="8" width="4" height="2" fill="#fff" />
          <rect x="4" y="10" width="8" height="2" fill="#fff" />
          <rect x="2" y="12" width="4" height="2" fill="#fff" />
        </svg>
        <span className="font-pixel text-[10px] text-white hidden sm:inline">
          Shannon
        </span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-3">
        {user && (
          <Link
            href="/flashcards"
            className="font-pixel text-[8px] text-[#9ca3af] hover:text-[#f97316] transition-colors px-3 py-2"
          >
            Flashcards
          </Link>
        )}
        {user && (
          <Link
            href="/skill-tree"
            className="font-pixel text-[8px] text-[#9ca3af] hover:text-[#f97316] transition-colors px-3 py-2"
          >
            Skills
          </Link>
        )}
        <Link
          href={user ? "/dashboard" : "/login"}
          className="pixel-btn text-[8px] !px-4 !py-2"
        >
          {user ? "Dashboard" : "Get Started"}
        </Link>
      </div>
    </nav>
  );
}
