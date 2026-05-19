"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // Route changed — complete immediately
    setProgress(100);
    const done = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 380);

    return () => clearTimeout(done);
  }, [pathname]);

  // Kick off progress animation when navigation starts
  // We hook into the router events via a custom event dispatched in useNavigate helper
  useEffect(() => {
    const onStart = () => {
      setVisible(true);
      setProgress(12);
      let p = 12;
      timerRef.current = setInterval(() => {
        p = p < 85 ? p + Math.random() * 10 : p + 0.5;
        if (p >= 92) {
          if (timerRef.current) clearInterval(timerRef.current);
          p = 92;
        }
        setProgress(Math.min(p, 92));
      }, 200);
    };

    window.addEventListener("nav:start", onStart);
    return () => {
      window.removeEventListener("nav:start", onStart);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px]"
      style={{ background: "transparent" }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background:
            "linear-gradient(90deg, #ff7a3d, #ffb36b, #ff7a3d)",
          boxShadow: "0 0 8px rgba(255,122,61,0.7), 0 0 20px rgba(255,122,61,0.4)",
          transition:
            progress === 100
              ? "width 0.25s ease-out, opacity 0.35s ease 0.25s"
              : "width 0.2s ease-out",
          opacity: progress === 100 ? 0 : 1,
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
