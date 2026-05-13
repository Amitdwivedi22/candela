import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBriefSection {
  problem: string;
  scaffold: string;
  checkpoints: string[];
  stretch: string;
}

export interface IRefinement {
  pushbackText: string;
  result: IBriefSection;
  createdAt: Date;
}

export interface IFormInput {
  course: string;
  week: string;
  projects: string[];
  language?: string;
  syllabus?: string;
  domain?: string;
}

export interface IBrief extends Document {
  userId: mongoose.Types.ObjectId;
  formInput: IFormInput;
  brief: IBriefSection;
  refinements: IRefinement[];
  status: 'saved' | 'in_progress' | 'completed' | 'abandoned';
  domain: 'tech' | 'commerce' | 'engineering';
  createdAt: Date;
}

const BriefSectionSchema = new Schema<IBriefSection>(
  {
    problem: { type: String, required: true },
    scaffold: { type: String, required: true },
    checkpoints: [{ type: String }],
    stretch: { type: String, required: true },
  },
  { _id: false }
);

const RefinementSchema = new Schema<IRefinement>(
  {
    pushbackText: { type: String, required: true },
    result: { type: BriefSectionSchema, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BriefSchema: Schema<IBrief> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    formInput: {
      course: { type: String, required: true },
      week: { type: String, required: true },
      projects: [{ type: String }],
      language: { type: String },
      syllabus: { type: String },
      domain: { type: String },
    },
    domain: {
      type: String,
      enum: ['tech', 'commerce', 'engineering'],
      default: 'tech',
    },
    brief: {
      type: BriefSectionSchema,
      required: true,
    },
    refinements: [RefinementSchema],
    status: {
      type: String,
      enum: ['saved', 'in_progress', 'completed', 'abandoned'],
      default: 'saved',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const Brief: Model<IBrief> = mongoose.models.Brief || mongoose.model<IBrief>('Brief', BriefSchema);

export default Brief;
