/* eslint-disable react/no-unescaped-entities */
"use client";

import { CSSProperties, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

const sheryThemeVars: CSSProperties = {
  "--night-glow": "#ff7a3d",
  "--night-warm": "#ffb36b",
  "--night-line": "rgba(255, 122, 61, 0.18)",
  "--night-panel": "#121212",
  "--night-panel-soft": "rgba(18, 18, 18, 0.88)",
  "--text-main": "#f7efe8",
  "--text-dim": "rgba(247, 239, 232, 0.64)",
} as CSSProperties;

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
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
        router.replace("/dashboard");
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
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen text-[var(--text-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border border-white/[0.10] bg-white/[0.03] flex items-center justify-center">
            <svg className="animate-spin w-6 h-6 text-[var(--night-glow)]" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 2 3.373 2 8h2z"
              />
            </svg>
          </div>
          <div className="text-sm text-white/60">Checking your session…</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#070707] text-[var(--text-main)]"
      style={sheryThemeVars}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,125,69,0.22),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(255,177,98,0.12),transparent_20%),linear-gradient(180deg,#070707_0%,#0b0b0b_48%,#070707_100%)]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      <div className="absolute left-[-8rem] top-20 h-[18rem] w-[18rem] rounded-full border border-white/8 bg-[rgba(255,122,61,0.06)] blur-3xl sm:h-[24rem] sm:w-[24rem]" />
      <div className="absolute bottom-[-8rem] right-[-6rem] h-[20rem] w-[20rem] rounded-full border border-white/8 bg-[rgba(255,255,255,0.03)] blur-3xl sm:bottom-[-10rem] sm:h-[28rem] sm:w-[28rem]" />

      <div className="relative z-10 min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden border-r border-[var(--night-line)] lg:flex lg:flex-col lg:p-12 lg:pt-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-[var(--night-line)] bg-[rgba(255,122,61,0.12)] shadow-[0_0_30px_rgba(255,122,61,0.16)]">
              <span className="display-font text-lg text-[var(--night-glow)]">N</span>
            </div>
            <div className="leading-none">
              <span className="display-font text-2xl">Nextstep</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                Build what comes next
              </span>
            </div>
          </Link>

          <div className="flex flex-1 flex-col justify-center">
            <div className="max-w-xl">
              <p className="mb-5 text-xs uppercase tracking-[0.38em] text-white/40">Member sign in</p>
              <h2 className="display-font text-6xl leading-[0.94] text-white">
                Turn class progress
                <span className="block text-[var(--night-glow)]">into proof of work.</span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[var(--text-dim)]">
                Sign back in, pick up your saved briefs, and keep building from the exact topics you just finished learning.
              </p>
            </div>
          </div>

          <div className="max-w-md rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
            <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--night-glow)]">Why students return</p>
            <blockquote className="display-font text-2xl leading-tight text-white">
              “Tell me what you&apos;ve done and I&apos;ll tell you what to build next.”
            </blockquote>
            <p className="mt-4 text-sm leading-6 text-[var(--text-dim)]">
              One lesson in, one project brief out. No generic roadmap. No filler tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-[var(--night-line)] bg-[rgba(255,122,61,0.12)]">
                <span className="display-font text-lg text-[var(--night-glow)]">N</span>
              </div>
              <span className="display-font text-2xl">Nextstep</span>
            </Link>

            <div className="rounded-[2rem] border border-white/8 bg-[rgba(10,10,10,0.78)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
              <h1 className="display-font text-3xl text-white sm:text-4xl">Sign In</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                Continue where you left off and turn your latest lesson into a project brief worth shipping.
              </p>

              {error && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/62" htmlFor="login-email">
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3.5 text-sm text-white placeholder:text-white/22 transition-all focus:border-[var(--night-glow)] focus:outline-none focus:ring-1 focus:ring-[rgba(255,122,61,0.25)]"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm text-white/62" htmlFor="login-password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-xs text-white/38 transition-colors hover:text-white/70"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password here"
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3.5 text-sm text-white placeholder:text-white/22 transition-all focus:border-[var(--night-glow)] focus:outline-none focus:ring-1 focus:ring-[rgba(255,122,61,0.25)]"
                  />
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--night-glow)] py-3.5 text-sm font-semibold text-[#120d09] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.07]" />
                <span className="text-xs text-white/28">Or</span>
                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>

              <button
                id="login-google-btn"
                onClick={handleGoogleSignIn}
                type="button"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.04] py-3.5 text-sm font-medium text-white/82 transition-all hover:bg-white/[0.08] hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <p className="mt-8 text-center text-sm text-white/38">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[var(--night-glow)] transition-colors hover:text-[var(--night-warm)]">
                  Create a new account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
