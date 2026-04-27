export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set([
     "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "of", "for", "it", 
     "this", "that", "with", "as", "by", "but", "or", "not", "are", "was", "were", "be", 
     "been", "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", 
     "would", "should", "may", "might", "must", "about", "from", "how", "why", "what", 
     "who", "when", "where", "please", "tell", "me", "remember", "save", "my", "i", "am"
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}
