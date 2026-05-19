"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";

// Using mode="sync" instead of mode="wait":
// - "wait" fully UNMOUNTS the old page before mounting the new one.
//   This causes every useSession() hook on the new page to re-initialize
//   and fire fresh /api/auth/session calls.
// - "sync" keeps both pages mounted simultaneously during the crossfade,
//   so the session context is never torn down → zero extra session calls.
const variants: Variants = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        style={{ minHeight: "100dvh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
