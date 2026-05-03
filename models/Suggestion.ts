import mongoose, { Schema, Document } from "mongoose";

export interface ISuggestion extends Document {
  text: string;
  type: "tools" | "languages" | "projects" | "practice";
}

const SuggestionSchema = new Schema<ISuggestion>({
  text: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ["tools", "languages", "projects", "practice"],
    required: true,
    index: true,
  },
});

export const Suggestion = mongoose.models.Suggestion || mongoose.model<ISuggestion>("Suggestion", SuggestionSchema);
