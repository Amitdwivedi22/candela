"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { motion } from "framer-motion";

function LogoMark() {
  return (
    <div className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] border border-[rgba(255,184,108,0.24)] bg-[linear-gradient(145deg,rgba(255,144,77,0.24),rgba(255,122,61,0.08)_58%,rgba(14,14,14,0.92))] shadow-[0_16px_40px_rgba(0,0,0,0.3),0_0_26px_rgba(255,122,61,0.16)] transition-transform duration-300 group-hover:scale-[1.04] sm:h-11 sm:w-11 sm:rounded-[1.35rem]">
        <div className="absolute inset-[1px] rounded-[1.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_26%,rgba(0,0,0,0.16)_100%)]" />
        <div className="absolute -left-1 top-1 h-5 w-5 rounded-full bg-[rgba(255,214,170,0.34)] blur-md" />
        <span className="relative display-font text-[1.15rem] tracking-[0.08em] text-[var(--text-main)]">N</span>
      </div>
      <div className="min-w-0 leading-none">
        <div className="truncate display-font text-[1.2rem] tracking-[0.04em] text-[var(--text-main)] transition-colors duration-300 group-hover:text-white sm:text-[1.45rem]">
          Nextstep
        </div>
        <div className="mt-1 hidden text-[0.58rem] font-medium uppercase tracking-[0.26em] text-[rgba(246,239,226,0.5)] sm:block sm:text-[0.62rem] sm:tracking-[0.34em]">
          Build what comes next
        </div>
      </div>
    </div>
  );
}

// TopBar receives session as a prop — avoids a second useSession() call
// that would fire a duplicate /api/auth/session network request.
function TopBar({ session }: { session: Session | null }) {
  return (
    <header className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-[rgba(255,184,108,0.14)] bg-[linear-gradient(180deg,rgba(11,11,11,0.84),rgba(11,11,11,0.68))] px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:rounded-[1.9rem] sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left_top,rgba(255,161,97,0.14),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(255,122,61,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_42%,rgba(255,255,255,0.01)_100%)]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,206,160,0.5),transparent)]" />
          <div className="relative flex items-center justify-between gap-3 sm:gap-4">
            <Link href="/" className="min-w-0 shrink">
              <LogoMark />
            </Link>
            <div className="hidden items-center justify-center md:flex">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[0.67rem] font-medium uppercase tracking-[0.28em] text-[rgba(246,239,226,0.58)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                AI Brief Studio
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {session ? (
            <Link href="/dashboard" className="rounded-full border border-[rgba(255,184,108,0.22)] bg-[linear-gradient(135deg,var(--night-warm),var(--night-glow))] px-3 py-2 text-xs font-semibold text-[#0d1720] shadow-[0_12px_30px_rgba(255,122,61,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(255,122,61,0.28)] sm:px-5 sm:py-2.5 sm:text-sm">
              Enter studio
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-full border border-transparent px-2.5 py-2 text-xs text-[var(--text-dim)] transition-colors hover:border-white/8 hover:bg-white/[0.04] hover:text-[var(--text-main)] sm:px-4 sm:text-sm">
                Log in
              </Link>
              <Link href="/signup" className="rounded-full border border-[rgba(255,184,108,0.22)] bg-[linear-gradient(180deg,rgba(255,184,108,0.22),rgba(255,122,61,0.12))] px-3 py-2 text-xs font-semibold text-[var(--text-main)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(255,184,108,0.28),rgba(255,122,61,0.16))] sm:px-5 sm:py-2.5 sm:text-sm">
                Start free
              </Link>
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const highlights = [
  {
    title: "You stop asking “what should I build?”",
    body: "Nextstep solves the hardest part for students: turning what you learned in class into a project idea that is clear, useful, and realistic to start.",
  },
  {
    title: "It uses what you learned this week",
    body: "Instead of random project ideas, the brief is based on your current week, your subject, and your level, so the work feels relevant and easier to begin.",
  },
  {
    title: "It gives you a real starting point",
    body: "You get structure, clear steps, and a practical direction so you can move from lecture notes to actual work without feeling lost.",
  },
];

const domainCards = [
  {
    title: "Tech & Software",
    subtitle: "Build with code",
    emoji: "⌨️",
    description: "For coding projects, scripts, apps, APIs, and product builds tied to the exact concepts you just learned.",
    useCase: "Best when you want a runnable project with scaffolds, checkpoints, and something you can ship or demo.",
    examples: ["Python tools", "React builds", "ML experiments"],
  },
  {
    title: "Commerce & Finance",
    subtitle: "Think like an analyst",
    emoji: "📊",
    description: "For business cases, finance thinking, market analysis, and recommendation-heavy project briefs.",
    useCase: "Best when you want structured cases, decision-making pressure, and business reasoning grounded in numbers.",
    examples: ["Case studies", "Market analysis", "Pitch decks"],
  },
  {
    title: "Engineering",
    subtitle: "Design with constraints",
    emoji: "⚙️",
    description: "For engineering problems with realistic systems, calculations, practical limits, and applied reasoning.",
    useCase: "Best when you want a design-style challenge that feels closer to actual engineering work than classroom theory.",
    examples: ["Structures", "Thermo", "Control systems"],
  },
];

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--text-main)]">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,111,60,0.24),transparent_26%),radial-gradient(circle_at_78%_16%,rgba(255,152,81,0.16),transparent_24%),radial-gradient(circle_at_50%_68%,rgba(255,79,32,0.14),transparent_34%),linear-gradient(180deg,#060606_0%,#0a0a0a_48%,#050505_100%)]" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
        <div className="absolute inset-x-0 top-[-10rem] mx-auto h-[18rem] w-[34rem] rounded-full bg-[rgba(255,115,63,0.12)] blur-[100px] sm:top-[-18rem] sm:h-[28rem] sm:w-[72rem] sm:blur-[140px]" />
        <div className="absolute left-[-10rem] top-24 h-[18rem] w-[18rem] rounded-full border border-white/8 bg-[rgba(255,255,255,0.02)] blur-3xl sm:left-[-14rem] sm:h-[26rem] sm:w-[26rem]" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-[20rem] w-[20rem] rounded-full border border-white/8 bg-[rgba(255,106,58,0.05)] blur-3xl sm:bottom-[-10rem] sm:right-[-8rem] sm:h-[30rem] sm:w-[30rem]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.68)_70%,#050505_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.52)_100%)]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-[18%] hidden h-32 w-32 rounded-full border border-white/10 sm:block" />
          <div className="absolute right-[14%] top-[24%] hidden h-24 w-24 rounded-full border border-white/10 sm:block" />
          <div className="absolute bottom-[18%] left-[52%] hidden h-40 w-40 -translate-x-1/2 rounded-full border border-white/10 sm:block" />
        </div>

        <TopBar session={session} />

        <main className="relative z-10">
          <section className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl items-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-4xl">
              <p className="mb-5 text-[11px] uppercase tracking-[0.28em] text-white/45 sm:mb-6 sm:text-xs sm:tracking-[0.38em]">Built from what you learn next</p>
              <blockquote className="max-w-5xl">
                <h1 className="display-font text-[2.9rem] leading-[0.92] text-white xs:text-[3.2rem] sm:text-6xl lg:text-8xl">
                  “Tell me what you&apos;ve done
                  <span className="block text-white/88">and I&apos;ll tell you what to build next”</span>
                </h1>
              </blockquote>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:mt-8 sm:text-lg">
                Nextstep turns the topic you just learned into one concrete project brief you can start tonight, with real scaffolds and checkpoints that force understanding.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={session ? "/dashboard" : "/signup"} className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-black transition-transform hover:scale-[1.02] sm:min-w-[12rem]">
                  {session ? "Go to dashboard" : "Generate my first brief"}
                </Link>
                <Link href={session ? "/dashboard" : "/login"} className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-white/10 sm:min-w-[12rem]">
                  {session ? "Review saved briefs" : "I already have an account"}
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="studio-card rounded-[2rem] p-6">
            <div className="studio-label mb-3 text-xs">What Nextstep does</div>
            <div className="rounded-[1.5rem] border border-[rgba(255,255,255,0.06)] bg-[rgba(6,12,18,0.55)] p-5">
              <div className="mb-3 flex items-center justify-between text-xs text-[var(--text-dim)]">
                <span>Student problem</span>
                <span>Real solution</span>
              </div>
              <h2 className="display-font text-2xl leading-tight text-[var(--text-main)]">
                “I learned something today, but I still don’t know what to build with it.”
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                Nextstep turns that confusion into one clear project brief, so a student can go from “I studied this topic” to “I know exactly what I should make next.”
              </p>
            </div>
          </div>

          <div className="studio-card rounded-[2rem] p-6">
            <div className="studio-label mb-3 text-xs">What problem it solves</div>
            <div className="grid gap-3">
              {[
                "Too much theory, not enough real practice",
                "Too many vague project ideas online",
                "No clear bridge from classwork to portfolio work",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text-main)]">
                  <span className="text-[var(--night-warm)]">✦</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="studio-card rounded-[1.75rem] p-6">
              <div className="mb-4 h-1.5 w-16 rounded-full bg-[linear-gradient(90deg,var(--night-glow),var(--night-warm))]" />
              <h3 className="display-font text-2xl text-[var(--text-main)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="space-y-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs uppercase tracking-[0.32em] text-white/45">Switch domain</p>
            <h2 className="display-font text-3xl leading-tight text-white sm:text-5xl">
              Choose the kind of brief
              <span className="block text-[var(--night-glow)]">you want next.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Each studio thinks differently. Hover a card to see what that domain is actually useful for, then jump into the one that fits the kind of work you want to practice.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-7">
            {domainCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.09 }}
                className="group relative flex h-full flex-col overflow-hidden rounded-[2rem]"
                style={{
                  transform: "translateZ(0)",
                }}
              >
                <Link
                  href={session ? "/dashboard/select-domain" : "/signup"}
                  className="relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(10,10,10,0.92)_55%,rgba(255,122,61,0.06)_100%)] p-6 shadow-[0_2px_24px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 hover:border-[rgba(255,122,61,0.32)] hover:shadow-[0_8px_40px_rgba(255,122,61,0.18),0_2px_12px_rgba(0,0,0,0.4)] hover:-translate-y-1"
                >
                  {/* Ambient gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,61,0.12),transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {/* Top shimmer line */}
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,184,108,0.5),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {/* Bottom glow edge */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,122,61,0.24),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative z-10 flex h-full flex-col">
                    {/* Header row */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-[rgba(255,122,61,0.22)] bg-[rgba(255,122,61,0.1)] text-2xl transition-all duration-300 group-hover:border-[rgba(255,122,61,0.42)] group-hover:bg-[rgba(255,122,61,0.18)] group-hover:shadow-[0_0_16px_rgba(255,122,61,0.28)]"
                      >
                        {card.emoji}
                      </div>
                      <span className="mt-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/45 transition-colors duration-300 group-hover:border-[rgba(255,122,61,0.18)] group-hover:text-[rgba(255,177,98,0.8)]">
                        {card.subtitle}
                      </span>
                    </div>

                    {/* Title + description */}
                    <div className="flex-1">
                      <h3 className="display-font text-[1.7rem] leading-[1.1] text-white transition-colors duration-300 group-hover:text-white">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-[13.5px] leading-[1.7] text-white/58">
                        {card.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {card.examples.map((example) => (
                        <span
                          key={example}
                          className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/52 transition-all duration-300 group-hover:border-[rgba(255,122,61,0.2)] group-hover:bg-[rgba(255,122,61,0.08)] group-hover:text-white/80"
                        >
                          {example}
                        </span>
                      ))}
                    </div>

                    {/* Use-case preview panel */}
                    <div className="mt-5 pt-1">
                      <div className="relative h-[5.5rem] overflow-hidden rounded-[1.2rem] border border-white/[0.07] bg-white/[0.025]">
                        {/* Default state */}
                        <div className="absolute inset-0 flex flex-col justify-center px-4 transition-all duration-400 group-hover:opacity-0 group-hover:translate-y-2">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-white/38">Hover to preview</p>
                          <p className="mt-1.5 text-[13px] leading-[1.55] text-white/65">
                            See what this domain helps you practice.
                          </p>
                        </div>
                        {/* Hover reveal state */}
                        <div className="absolute inset-0 flex translate-y-3 flex-col justify-center border-t border-[rgba(255,122,61,0.14)] bg-[linear-gradient(180deg,rgba(255,122,61,0.07),rgba(10,10,10,0.94))] px-4 opacity-0 transition-all duration-400 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-[rgba(255,177,98,0.8)]">Use it for</p>
                          <p className="mt-1.5 text-[13px] leading-[1.55] text-white/80">
                            {card.useCase}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden border-t border-[var(--night-line)] bg-[linear-gradient(180deg,#090909_0%,#050505_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,122,61,0.08),transparent_26%),radial-gradient(circle_at_80%_80%,rgba(255,184,108,0.06),transparent_24%)]" />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.32em] text-white/40">Build what comes next</p>
              <motion.div
                initial={false}
                whileHover="hover"
                className="group inline-flex cursor-default flex-col"
              >
                <motion.h2
                  variants={{ hover: { y: -2, letterSpacing: "0.01em" } }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="display-font text-[4.2rem] font-semibold leading-none text-transparent sm:text-[7rem] lg:text-[9rem]"
                  style={{
                    WebkitTextStroke: "1.5px rgba(255,255,255,0.16)",
                    textShadow: "0 0 0 rgba(0,0,0,0)",
                    backgroundImage: "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(8,8,8,0) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                >
                  <motion.span
                    variants={{
                      hover: {
                        color: "rgba(8,8,8,0.92)",
                        textShadow: "0 10px 30px rgba(0,0,0,0.28)",
                      },
                    }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="inline-block"
                  >
                    Nextstep
                  </motion.span>
                </motion.h2>
                <motion.div
                  variants={{ hover: { opacity: 1, y: 0 } }}
                  initial={{ opacity: 0.45, y: 10 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="mt-4 overflow-hidden rounded-full border border-[rgba(255,122,61,0.18)] bg-[rgba(255,122,61,0.08)] px-4 py-2 text-sm text-[var(--night-warm)]"
                >
                  Turn what you learned into something you can actually build.
                </motion.div>
              </motion.div>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                Nextstep helps students stop collecting theory with nowhere to use it. You tell it what you learned, and it gives you a focused project brief that turns coursework into practice.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-4 text-xs uppercase tracking-[0.26em] text-[var(--night-glow)]">Explore</p>
                <div className="flex flex-col gap-3 text-sm text-white/62">
                  <Link href="/" className="transition-colors hover:text-white">Home</Link>
                  <Link href={session ? "/dashboard" : "/signup"} className="transition-colors hover:text-white">
                    {session ? "Dashboard" : "Get started"}
                  </Link>
                  <Link href={session ? "/dashboard/select-domain" : "/signup"} className="transition-colors hover:text-white">
                    Switch domain
                  </Link>
                </div>
              </div>

              <div>
                <p className="mb-4 text-xs uppercase tracking-[0.26em] text-[var(--night-glow)]">Why it exists</p>
                <div className="flex flex-col gap-3 text-sm text-white/62">
                  <p>Students learn concepts but still struggle to decide what to build next.</p>
                  <p>Nextstep solves that gap by giving one clear project direction at the right level.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-white/38 sm:flex-row sm:items-center sm:justify-between">
            <p>Nextstep</p>
            <p>Built for students who want clearer practice, not more confusion.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
