import { pipeline } from "@xenova/transformers";
import { preprocessText, cosineSimilarity } from "../utils/textProcess";

// Initialize the NLP pipeline
let embedder: any;

const initializeEmbedder = async () => {
  const MINILM_MODEL = "Xenova/all-MiniLM-L6-v2";
  const BERT_MODEL = "Xenova/bert-base-uncased";

  embedder = await pipeline("feature-extraction", BERT_MODEL);
};

// Function to calculate keyword-based score
const calculateKeywordScore = (
  resumeTokens: string[],
  jobDescriptionTokens: string[]
): number => {
  const matchedKeywords = jobDescriptionTokens.filter((keyword) =>
    resumeTokens.includes(keyword)
  ).length;

  if (matchedKeywords === jobDescriptionTokens.length) {
    return 100; // All keywords matched
  } else if (matchedKeywords > 0) {
    return (matchedKeywords / jobDescriptionTokens.length) * 100; // Partial match
  } else {
    return 0; // No keywords matched
  }
};

// Main function to calculate the score
export const calculateResumeScore = async (
  resumeText: string,
  jobDescription: string
): Promise<number> => {
  if (!embedder) {
    await initializeEmbedder();
  }

  // Preprocess the texts
  const resumeTokens = await preprocessText(resumeText);
  const jobDescriptionTokens = await preprocessText(jobDescription);

  // If job description is a single keyword, enforce exact matching
  if (jobDescriptionTokens.length === 1) {
    const keyword = jobDescriptionTokens[0];
    return resumeTokens.includes(keyword) ? 100 : 0;
  }

  // Calculate keyword-based score for multiple keywords
  const keywordScore = calculateKeywordScore(
    resumeTokens,
    jobDescriptionTokens
  );

  // If all keywords are matched, return 100
  if (keywordScore === 100) {
    return 100;
  }

  // If some keywords are matched, return the keyword score
  if (keywordScore > 0) {
    return keywordScore;
  }

  // Fallback to semantic similarity if no keywords are matched
  const processedResume = resumeTokens.join(" ");
  const processedJobDescription = jobDescriptionTokens.join(" ");

  // Get embeddings for the resume and job description
  const resumeEmbedding = await embedder(processedResume, {
    pooling: "mean",
    normalize: true,
  });
  const jobDescriptionEmbedding = await embedder(processedJobDescription, {
    pooling: "mean",
    normalize: true,
  });

  // Calculate cosine similarity
  const similarity = cosineSimilarity(
    resumeEmbedding.data,
    jobDescriptionEmbedding.data
  );

  // Convert similarity to a score between 0 and 100
  const semanticScore = (similarity + 1) * 50;

  return semanticScore;
};
