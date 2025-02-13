import pdf from "pdf-parse";
import mammoth from "mammoth";
import textract from "textract";
import fs from "fs";

export const parsePDF = async (buffer: Buffer): Promise<string> => {
  const data = await pdf(buffer);
  return data.text;
};

export const parseDOCX = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

// Main parsing function
export const parseResume = async (
  filePath: string,
  mimetype: string
): Promise<string> => {
  try {
    const buffer = fs.readFileSync(filePath);

    switch (mimetype) {
      case "application/pdf":
        return await parsePDF(buffer);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await parseDOCX(buffer);
      case "application/msword":
        return await parseDOC(filePath);
      default:
        throw new Error("Unsupported file format");
    }
  } catch (error: any) {
    console.error(`Error parsing file: ${error.message}`);
    throw error;
  }
};

export async function parseDOC(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, (err: Error | null, text: string) => {
      if (err) {
        reject(`Failed to parse file: ${err.message}`);
      } else {
        resolve(text);
      }
    });
  });
}
