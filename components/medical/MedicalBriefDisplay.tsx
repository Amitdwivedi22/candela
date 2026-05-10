"use client";

import { motion } from "framer-motion";

interface MedicalBriefDisplayProps {
  rawText: string;
  isStreaming: boolean;
  courseName?: string;
}

function parseMedicalBrief(text: string) {
  const sections: Record<string, string> = {
    "Clinical Case Presentation": "",
    "Investigation Scaffold": "",
    "Differential Diagnosis Checkpoints": "",
    "Management Plan Challenge": "",
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

  // Render markdown tables nicely if they exist
  const hasTable = content.includes("|");
  const lines = content.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-[#1A0F14] border border-white/[0.08] rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className={`font-semibold text-base ${color}`}>{title}</h3>
      </div>

      {hasTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white/80 border-collapse">
            {lines.filter(l => l.includes("|")).map((row, ri) => {
              const cells = row.split("|").filter(c => c.trim());
              const isHeader = ri === 0;
              const isSeparator = cells.every(c => c.trim().match(/^[-:]+$/));
              if (isSeparator) return null;
              return (
                <tr key={ri} className={isHeader ? "border-b border-rose-500/20" : "border-b border-white/5"}>
                  {cells.map((cell, ci) => isHeader
                    ? <th key={ci} className="py-2 px-3 text-left text-rose-400 font-medium text-xs">{cell.trim()}</th>
                    : <td key={ci} className="py-2 px-3 text-white/70 text-xs">{cell.trim()}</td>
                  )}
                </tr>
              );
            })}
          </table>
          {/* Any non-table content */}
          {lines.filter(l => !l.includes("|") && l.trim()).map((line, i) => (
            <p key={i} className="mt-2 text-white/70 text-sm leading-relaxed">{line}</p>
          ))}
        </div>
      ) : (
        <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap space-y-2">
          {content.split("\n").map((line, i) => {
            if (line.match(/^\d+\./)) {
              return (
                <div key={i} className="flex gap-3 my-2">
                  <span className={`font-semibold ${color} shrink-0 w-5`}>{line.split(".")[0]}.</span>
                  <span>{line.slice(line.indexOf(".") + 1).trim()}</span>
                </div>
              );
            }
            if (line.match(/^- /)) {
                return (
                  <div key={i} className="flex gap-3 my-1">
                    <span className={`font-semibold ${color} shrink-0 w-3`}>•</span>
                    <span>{line.slice(2).trim()}</span>
                  </div>
                );
            }
            return line ? <p key={i}>{line}</p> : null;
          })}
        </div>
      )}
    </motion.div>
  );
}

export function MedicalBriefDisplay({ rawText, isStreaming, courseName }: MedicalBriefDisplayProps) {
  if (isStreaming || !rawText) {
    return (
      <div className="bg-[#1A0F14] border border-rose-500/10 rounded-2xl p-6 sm:p-8">
        {isStreaming ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-rose-400 text-sm font-medium">Generating clinical case...</span>
            </div>
            <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans">{rawText}</pre>
          </div>
        ) : (
          <div className="text-white/30 text-center py-12">Case will appear here.</div>
        )}
      </div>
    );
  }

  const sections = parseMedicalBrief(rawText);

  return (
    <div className="flex flex-col gap-4">
      {courseName && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/40 text-sm">
          Case generated for <span className="text-rose-400">{courseName}</span>
        </motion.p>
      )}
      <SectionCard icon="🩺" title="Clinical Case Presentation" content={sections["Clinical Case Presentation"]} color="text-rose-400" delay={0} />
      <SectionCard icon="🔬" title="Investigation Scaffold" content={sections["Investigation Scaffold"]} color="text-rose-300" delay={0.1} />
      <SectionCard icon="🤔" title="Differential Diagnosis Checkpoints" content={sections["Differential Diagnosis Checkpoints"]} color="text-orange-400" delay={0.2} />
      <SectionCard icon="📋" title="Management Plan Challenge" content={sections["Management Plan Challenge"]} color="text-rose-400" delay={0.3} />

      {/* Raw fallback if parsing failed */}
      {!Object.values(sections).some(v => v) && (
        <div className="bg-[#1A0F14] border border-white/10 rounded-2xl p-6">
          <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans">{rawText}</pre>
        </div>
      )}
    </div>
  );
}
