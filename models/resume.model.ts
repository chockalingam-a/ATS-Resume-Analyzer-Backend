import { Schema, model, Document } from 'mongoose';

interface IResume extends Document {
  filename: string;
  s3Key: string;
  content: string;
  keywords: string[];
}

const ResumeSchema = new Schema<IResume>({
  filename: { type: String, required: true },
  s3Key: { type: String, required: true },
  content: { type: String, required: true },
  keywords: { type: [String], default: [] },
});

export default model<IResume>('Resume', ResumeSchema);