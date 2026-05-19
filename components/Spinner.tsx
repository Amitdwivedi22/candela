import { CSSProperties } from "react";

interface SpinnerProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Thin orange ring spinner — matches the Nextstep brand. */
export function Spinner({ size = 20, className = "", style }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/** Full-screen centred loader used for session/route level loading states. */
export function FullScreenLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#070707]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(255,122,61,0.22)] bg-[rgba(255,122,61,0.08)]">
        <Spinner size={24} className="text-[#ff7a3d]" />
      </div>
      <p className="text-sm text-white/45">{label}</p>
    </div>
  );
}
