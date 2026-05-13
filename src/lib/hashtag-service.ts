
/**
 * @fileOverview Hashtag extraction and validation utility
 */

export function extractHashtags(text: string): string[] {
  if (!text) return [];
  // Regex to match # followed by Arabic or English characters
  const regex = /#[\u0600-\u06FFa-zA-Z][\u0600-\u06FF\w]*/g;
  const matches = text.match(regex) || [];
  
  // Clean, unique, and lowercased for indexing
  const uniqueTags = Array.from(new Set(matches))
    .filter(h => h.length > 1)
    .map(h => h.toLowerCase());
    
  return uniqueTags;
}

export function validateHashtagLimit(tags: string[]): boolean {
  return tags.length <= 10;
}
