export interface FormInput {
  course: string;
  week: number;
  projects: string[];
  language: string;
  difficulty: number; // 1 (Beginner) → 5 (Expert), default 3
  syllabus?: string;
}

export interface BriefSection {
  problem: string;
  scaffold: string;
  checkpoints: string[];
  stretch: string;
}

export interface PushbackInput extends FormInput {
  pushback: string;
}
