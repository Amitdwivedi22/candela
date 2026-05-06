"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created — please sign in.");
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await signIn("firebase", {
        idToken,
        redirect: false,
      });

      if (res?.error) {
        setError("Error signing in with Google. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err instanceof Error && "code" in err && typeof err.code === "string") {
        setError(`Google sign-in failed: ${err.code}`);
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
        return;
      }

      setError("Failed to sign in with Google.");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]">
      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 pt-8 border-r border-white/[0.07]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#3b82f6] flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>C</span>
          </div>
          <div className="leading-none">
            <span className="text-white font-semibold text-sm tracking-wide">Candela</span>
            <span className="block text-white/30 text-[9px] tracking-widest uppercase">Build to prove it.</span>
          </div>
        </Link>

        <div className="max-w-sm space-y-8">
          {/* What you get */}
          {[
            { n: "01", title: "A project brief tailored to you", body: "Input your course, week, and experience. Get a project one step past your comfort zone." },
            { n: "02", title: "An AI tutor that won't solve it for you", body: "When you're stuck, Candela asks the question that gets you unstuck — not the answer." },
            { n: "03", title: "A portfolio employers can open", body: "Three months in, you'll have shipped three projects with documented reasoning." },
          ].map(({ n, title, body }) => (
            <div key={n} className="flex gap-4">
              <span className="text-[#3b82f6] text-xs font-semibold mt-1 shrink-0">{n}</span>
              <div>
                <p className="text-white text-sm font-medium mb-1">{title}</p>
                <p className="text-white/40 text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/25 text-xs">
          May 2026 cohort · free for the first 100
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-7 h-7 rounded-full bg-[#3b82f6] flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">Candela</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <h1
            className="text-3xl font-bold text-white mb-8"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Create your account.
          </h1>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5" htmlFor="signup-name">
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Doe"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl focus:outline-none focus:border-[#3b82f6]/60 focus:ring-1 focus:ring-[#3b82f6]/30 text-white text-sm placeholder:text-white/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5" htmlFor="signup-email">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl focus:outline-none focus:border-[#3b82f6]/60 focus:ring-1 focus:ring-[#3b82f6]/30 text-white text-sm placeholder:text-white/20 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-white/60" htmlFor="signup-password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl focus:outline-none focus:border-[#3b82f6]/60 focus:ring-1 focus:ring-[#3b82f6]/30 text-white text-sm placeholder:text-white/20 transition-all"
              />
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#3b82f6] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                "Create account →"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Google */}
          <button
            id="signup-google-btn"
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/80 hover:text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-white/35">
            Already have an account?{" "}
            <Link href="/login" className="text-[#3b82f6] hover:text-blue-400 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
