'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/shared/GoogleIcon'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fdf6ee] bg-[radial-gradient(ellipse_at_20%_80%,#e8c9a822_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,#d9775722_0%,transparent_60%)]">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <Button
          variant="outline"
          className="w-full cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5 hover:shadow-md"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>
    </div>
  )
}
