/**
 * Splits text into chunks of approximately the specified word count,
 * ensuring chunks end at sentence boundaries when possible.
 */
export function chunkText(text: string, maxWords: number = 500): string[] {
  if (!text.trim()) return []
  
  const words = text.trim().split(/\s+/)
  
  // If text is shorter than max words, return as single chunk
  if (words.length <= maxWords) {
    return [text]
  }
  
  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentWordCount = 0
  
  // Split into sentences first
  const sentences = text.split(/(?<=[.!?])\s+/)
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/)
    const sentenceWordCount = sentenceWords.length
    
    // If adding this sentence would exceed the limit
    if (currentWordCount + sentenceWordCount > maxWords && currentChunk.length > 0) {
      // Save current chunk and start a new one
      chunks.push(currentChunk.join(' '))
      currentChunk = []
      currentWordCount = 0
    }
    
    // If a single sentence is longer than maxWords, split it
    if (sentenceWordCount > maxWords) {
      // Save current chunk if it has content
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '))
        currentChunk = []
        currentWordCount = 0
      }
      
      // Split the long sentence into smaller chunks
      const longSentenceChunks = splitLongSentence(sentence, maxWords)
      chunks.push(...longSentenceChunks)
    } else {
      // Add sentence to current chunk
      currentChunk.push(sentence)
      currentWordCount += sentenceWordCount
    }
  }
  
  // Add remaining chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0)
}

/**
 * Splits a long sentence into smaller chunks at word boundaries
 */
function splitLongSentence(sentence: string, maxWords: number): string[] {
  const words = sentence.trim().split(/\s+/)
  const chunks: string[] = []
  
  for (let i = 0; i < words.length; i += maxWords) {
    const chunk = words.slice(i, i + maxWords).join(' ')
    chunks.push(chunk)
  }
  
  return chunks
}

/**
 * Estimates the word count of a text string
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0
  return text.trim().split(/\s+/).length
}

/**
 * Validates if text needs to be chunked based on word count
 */
export function needsChunking(text: string, threshold: number = 500): boolean {
  if (!text) return false
  return countWords(text) > threshold
} 