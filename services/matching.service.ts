import natural from "natural";
import Resume from "../models/resume.model";

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer; // Stemming for normalization
const wordnet = new natural.WordNet();

/**
 * Generate synonyms for a word using WordNet
 */
const getSynonyms = async (word: string): Promise<string[]> => {
  return new Promise((resolve) => {
    wordnet.lookup(word, (results) => {
      if (!results || results.length === 0) {
        resolve([word]); // No synonyms found, return the word itself
      } else {
        const synonyms = results.flatMap((entry) => entry.synonyms);
        resolve([...new Set(synonyms), word]); // Remove duplicates & include original word
      }
    });
  });
};

/**
 * Extracts phrases (bigrams/trigrams) for better context matching
 */
const extractPhrases = (text: string): string[] => {
  const words = tokenizer.tokenize(text.toLowerCase());
  const phrases: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  return phrases;
};

const computeMatchScore = async (
  resumeText: string,
  jobDescription: string
): Promise<number> => {
  const resumeTokens = new Set(tokenizer.tokenize(resumeText.toLowerCase()));
  const jobTokens = new Set(tokenizer.tokenize(jobDescription.toLowerCase()));

  // Normalize words using stemming
  const normalizedResumeTokens = new Set(
    [...resumeTokens].map((token) => stemmer.stem(token))
  );
  const normalizedJobTokens = new Set(
    [...jobTokens].map((token) => stemmer.stem(token))
  );

  // Fetch synonyms for job description tokens
  const jobTokenSynonyms = new Set<string>();
  for (const token of normalizedJobTokens) {
    const synonyms = await getSynonyms(token);
    synonyms.forEach((synonym) => jobTokenSynonyms.add(stemmer.stem(synonym)));
  }

  // Extract key phrases (bigrams/trigrams)
  const jobPhrases = new Set(extractPhrases(jobDescription));
  const resumePhrases = new Set(extractPhrases(resumeText));

  let matchedTokens = 0;
  let phraseMatchCount = 0;
  let numberMatchCount = 0;

  // Count word matches (including synonyms)
  for (const token of normalizedResumeTokens) {
    if (jobTokenSynonyms.has(token)) {
      matchedTokens++;
    }
  }

  // Count phrase matches
  for (const phrase of resumePhrases) {
    if (jobPhrases.has(phrase)) {
      phraseMatchCount++;
    }
  }

  // Number matching (partial match for phone numbers, years, etc.)
  const resumeNumbers = resumeText.match(/\d+/g) || [];
  const jobNumbers = jobDescription.match(/\d+/g) || [];

  for (const jobNum of jobNumbers) {
    if (resumeNumbers.some((resNum) => resNum.includes(jobNum))) {
      numberMatchCount++;
    }
  }

  const totalJobKeywords = normalizedJobTokens.size;
  const matchRatio = matchedTokens / totalJobKeywords;

  // If **all** job description keywords are present, return 100%
  if (matchRatio === 1) {
    return 100;
  }

  // Weighted scoring system
  const wordMatchScore = matchRatio * 80; // Now contributes up to 80%
  const phraseMatchScore = phraseMatchCount > 0 ? 15 : 0;
  const numberMatchScore = numberMatchCount > 0 ? 5 : 0;


  return Math.round(
    Math.min(100, wordMatchScore + phraseMatchScore + numberMatchScore)
  );
};

export const matchResumes = async (
  resumeIds: string[],
  jobDescription: string
) => {
  const resumes = await Resume.find({ _id: { $in: resumeIds } });

  const matchResults = await Promise.all(
    resumes.map(async (resume) => ({
      resumeId: resume._id,
      matchScore: await computeMatchScore(resume.content, jobDescription),
    }))
  );

  return matchResults.sort((a, b) => b.matchScore - a.matchScore);
};
