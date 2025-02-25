import natural from "natural";
import { removeStopwords } from "stopword";

// Abbreviation mapping
const abbreviationMap: { [key: string]: string } = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  cs: "csharp",
  java: "java", // Explicitly map "java" to avoid confusion with "javascript"
};

// Function to expand abbreviations
export const expandAbbreviations = (text: string): string => {
  const words = text.split(" ");
  return words
    .map((word) => abbreviationMap[word.toLowerCase()] || word)
    .join(" ");
};

// Function to preprocess text
export const preprocessText = (text: string): string[] => {
  // Expand abbreviations
  text = expandAbbreviations(text);

  // Convert to lowercase
  text = text.toLowerCase();

  // Tokenize the text
  const tokenizer = new natural.WordTokenizer();
  let tokens = tokenizer.tokenize(text) || [];

  // Remove stopwords
  tokens = removeStopwords(tokens);

  // Stem the tokens
  const stemmer = natural.PorterStemmer;
  tokens = tokens.map((token) => stemmer.stem(token));

  return tokens;
}

// Function to calculate cosine similarity
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};
