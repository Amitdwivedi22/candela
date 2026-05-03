"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function UserNav() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          Sign In
        </Link>
        <Link href="/signup" className="text-sm font-medium px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg transition-colors border border-white/[0.05]">
          Sign Up
        </Link>
      </div>
    );
  }

  const user = session.user;
  const initials = user.name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || "US";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-semibold shadow-lg hover:shadow-violet-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      >
        {user.image ? (
          <img src={user.image} alt={user.name || "Avatar"} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 bg-[#13131A] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
            >
              <div className="px-4 py-3 border-b border-white/[0.05]">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </div>
              <div className="py-1 border-t border-white/[0.05]">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
