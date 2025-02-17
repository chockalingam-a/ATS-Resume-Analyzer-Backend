import mammoth from "mammoth";
import textract from "textract";
import fs from "fs";

import { getDocument } from "pdfjs-dist";
import { parseStringPromise } from "xml2js";

export const parsePDF = async (
  buffer: Buffer
): Promise<{ text: string; links: string[] }> => {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;
  let text = "";
  let links: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    text += content.items.map((item: any) => item.str).join(" ");

    // Extract links from annotations
    const annotations = await page.getAnnotations();
    annotations.forEach((annotation: any) => {
      if (annotation.url) {
        links.push(annotation.url);
      }
    });
  }

  return { text, links };
};

/*
export const parseDOCX = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};
**/

export const parseDOCX = async (
  buffer: Buffer
): Promise<{ text: string; links: string[] }> => {
  const extractedText = await mammoth.extractRawText({ buffer });

  // Convert DOCX buffer to XML and extract hyperlinks
  const xmlData = await mammoth.convertToHtml({ buffer });
  const parsedXml = await parseStringPromise(xmlData.value);

  let links: string[] = [];
  if (parsedXml && parsedXml.body) {
    const hyperlinks = parsedXml.body[0].a || [];
    links = hyperlinks.map((link: any) => link.$?.href).filter(Boolean);
  }

  return { text: extractedText.value, links };
};

// Main parsing function
export const parseResume = async (
  filePath: string,
  mimetype: string
): Promise<{ text: string; links: string[] }> => {
  try {
    const buffer = fs.readFileSync(filePath);

    switch (mimetype) {
      case "application/pdf":
        return await parsePDF(buffer);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await parseDOCX(buffer);
      case "application/msword":
        // return await parseDOC(filePath);
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
