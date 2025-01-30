import pdf from "pdf-parse";
import mammoth from "mammoth";

export const parsePDF = async (buffer: Buffer): Promise<string> => {
  const data = await pdf(buffer);
  return data.text;
};

export const parseDOCX = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};
