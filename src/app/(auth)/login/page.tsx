'use client'

import { createClient } from '@/lib/supabase/client'
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
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f23]">
      {/* Decorative pixel dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#f97316] rounded-none star"
            style={{
              left: `${(i * 73 + 17) % 100}%`,
              top: `${(i * 37 + 11) % 100}%`,
              opacity: 0.2 + (i % 3) * 0.1,
              ['--delay' as string]: `${i * 0.3}s`,
              ['--duration' as string]: `${2 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-sm border-2 border-[#2a2a4e] bg-[#1a1a2e] p-8">
        {/* Pixel corner decorations */}
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#f97316]" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#f97316]" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#f97316]" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#f97316]" />

        <h1 className="mb-2 text-center font-pixel text-sm text-[#f97316]">
          Sign In
        </h1>
        <p className="mb-6 text-center text-xs text-[#6b7280]">
          Continue to Shannon
        </p>
        <button
          className="w-full flex items-center justify-center gap-2 border-2 border-[#2a2a4e] bg-[#0f0f23] px-4 py-3 text-sm text-[#d1d5db] hover:border-[#f97316] hover:text-white transition-colors cursor-pointer"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon />
          <span className="font-pixel text-[8px]">Continue with Google</span>
        </button>
      </div>
    </div>
  )
}
