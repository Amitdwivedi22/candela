"use client";

import { motion } from "framer-motion";

interface EngineeringBriefDisplayProps {
  rawText: string;
  isStreaming: boolean;
  courseName?: string;
}

function parseEngineeringBrief(text: string) {
  const sections: Record<string, string> = {
    "Design Problem": "",
    "Calculation Scaffold": "",
    "Checkpoint Questions": "",
    "Stretch Goal": "",
  };

  const keys = Object.keys(sections);
  for (let i = 0; i < keys.length; i++) {
    const header = `## ${keys[i]}`;
    const nextHeader = keys[i + 1] ? `## ${keys[i + 1]}` : null;
    const start = text.indexOf(header);
    if (start === -1) continue;
    const contentStart = start + header.length;
    const end = nextHeader ? text.indexOf(nextHeader) : text.length;
    sections[keys[i]] = text.slice(contentStart, end === -1 ? text.length : end).trim();
  }
  return sections;
}

function CodeOrTextDisplay({ content, color }: { content: string; color: string }) {
  if (!content) return null;

  // Render markdown code blocks nicely if they exist
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap space-y-4">
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].slice(3).trim() || "code";
          const code = lines.slice(1, -1).join("\n");
          return (
            <div key={i} className="my-3 overflow-hidden rounded-xl border border-amber-500/20 bg-[#0A0704]">
              <div className="bg-amber-500/10 px-4 py-1.5 border-b border-amber-500/20 text-xs font-mono text-amber-400 flex justify-between">
                <span>{lang}</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-[13px] leading-relaxed text-amber-100">{code}</pre>
              </div>
            </div>
          );
        }

        // Normal text
        return part.split("\n").map((line, j) => {
          if (!line.trim()) return null;
          if (line.match(/^\d+\./)) {
            return (
              <div key={`${i}-${j}`} className="flex gap-3 my-2">
                <span className={`font-semibold ${color} shrink-0 w-5`}>{line.split(".")[0]}.</span>
                <span>{line.slice(line.indexOf(".") + 1).trim()}</span>
              </div>
            );
          }
          return <p key={`${i}-${j}`}>{line}</p>;
        });
      })}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  content,
  color,
  delay,
}: {
  icon: string;
  title: string;
  content: string;
  color: string;
  delay: number;
}) {
  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-[#1A130F] border border-white/[0.08] rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className={`font-semibold text-base ${color}`}>{title}</h3>
      </div>
      <CodeOrTextDisplay content={content} color={color} />
    </motion.div>
  );
}

export function EngineeringBriefDisplay({ rawText, isStreaming, courseName }: EngineeringBriefDisplayProps) {
  if (isStreaming || !rawText) {
    return (
      <div className="bg-[#1A130F] border border-amber-500/10 rounded-2xl p-6 sm:p-8">
        {isStreaming ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm font-medium">Generating engineering brief...</span>
            </div>
            <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans">{rawText}</pre>
          </div>
        ) : (
          <div className="text-white/30 text-center py-12">Brief will appear here.</div>
        )}
      </div>
    );
  }

  const sections = parseEngineeringBrief(rawText);

  return (
    <div className="flex flex-col gap-4">
      {courseName && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/40 text-sm">
          Design brief generated for <span className="text-amber-400">{courseName}</span>
        </motion.p>
      )}
      <SectionCard icon="📐" title="Design Problem" content={sections["Design Problem"]} color="text-amber-400" delay={0} />
      <SectionCard icon="⚙️" title="Calculation Scaffold" content={sections["Calculation Scaffold"]} color="text-amber-300" delay={0.1} />
      <SectionCard icon="🔍" title="Checkpoint Questions" content={sections["Checkpoint Questions"]} color="text-amber-500" delay={0.2} />
      <SectionCard icon="🚀" title="Stretch Goal" content={sections["Stretch Goal"]} color="text-amber-400" delay={0.3} />

      {/* Raw fallback if parsing failed */}
      {!Object.values(sections).some(v => v) && (
        <div className="bg-[#1A130F] border border-white/10 rounded-2xl p-6">
          <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans">{rawText}</pre>
        </div>
      )}
    </div>
  );
}
