import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NavBar() {
  return (
    <nav className="flex w-full items-center justify-end px-6 py-4">
      <Button asChild className="px-5 py-2 text-sm">
        <Link href="/login">Get Started</Link>
      </Button>
    </nav>
  );
}
