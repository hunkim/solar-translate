import { useState, useCallback } from 'react'
import { chunkText, needsChunking, countWords } from '@/lib/textChunker'

export interface TranslationChunk {
  id: string
  originalText: string
  translatedText: string
  isTranslating: boolean
  error?: string
  wordCount: number
}

export interface TranslationProgress {
  currentChunk: number
  totalChunks: number
  isComplete: boolean
}

export interface UseTranslationProps {
  sourceLang: string
  targetLang: string
  instructions?: string
}

export function useTranslation({ sourceLang, targetLang, instructions }: UseTranslationProps) {
  const [chunks, setChunks] = useState<TranslationChunk[]>([])
  const [progress, setProgress] = useState<TranslationProgress>({
    currentChunk: 0,
    totalChunks: 0,
    isComplete: true
  })
  const [isTranslating, setIsTranslating] = useState(false)

  const translateChunk = useCallback(async (
    text: string,
    chunkId: string,
    onUpdate: (chunkId: string, content: string) => void
  ) => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
          instructions,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limiting
          const errorData = await response.json().catch(() => ({ error: 'Rate limit exceeded' }))
          const resetTime = errorData.resetTime ? new Date(errorData.resetTime) : null
          const waitMinutes = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60)) : 15
          
          throw new Error(`Rate limit reached. Please wait ${waitMinutes} minutes before trying again.`)
        }
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let translatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data.trim()) {
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  translatedContent += parsed.content
                  onUpdate(chunkId, translatedContent)
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      return translatedContent
    } catch (error) {
      console.error('Translation error:', error)
      throw error
    }
  }, [sourceLang, targetLang, instructions])

  const translateText = useCallback(async (text: string) => {
    if (!text.trim()) return

    setIsTranslating(true)
    
    try {
      // Check if text needs chunking
      const shouldChunk = needsChunking(text, 500)
      const textChunks = shouldChunk ? chunkText(text, 500) : [text]
      
      // Initialize chunks
      const initialChunks: TranslationChunk[] = textChunks.map((chunk, index) => ({
        id: `chunk-${index}`,
        originalText: chunk,
        translatedText: '',
        isTranslating: false,
        wordCount: countWords(chunk)
      }))

      setChunks(initialChunks)
      setProgress({
        currentChunk: 0,
        totalChunks: textChunks.length,
        isComplete: false
      })

      // Translate chunks sequentially to avoid overwhelming the API
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = initialChunks[i]
        
        // Update chunk status to translating
        setChunks(prev => prev.map(c => 
          c.id === chunk.id ? { ...c, isTranslating: true } : c
        ))

        setProgress(prev => ({ ...prev, currentChunk: i + 1 }))

        try {
          const onUpdate = (chunkId: string, content: string) => {
            setChunks(prev => prev.map(c => 
              c.id === chunkId ? { ...c, translatedText: content } : c
            ))
          }

          await translateChunk(chunk.originalText, chunk.id, onUpdate)

          // Mark chunk as complete
          setChunks(prev => prev.map(c => 
            c.id === chunk.id ? { ...c, isTranslating: false } : c
          ))
        } catch (error) {
          // Mark chunk as error
          setChunks(prev => prev.map(c => 
            c.id === chunk.id ? { 
              ...c, 
              isTranslating: false,
              error: error instanceof Error ? error.message : 'Translation failed'
            } : c
          ))
        }
      }

      setProgress(prev => ({ ...prev, isComplete: true }))
    } catch (error) {
      console.error('Translation process error:', error)
    } finally {
      setIsTranslating(false)
    }
  }, [translateChunk])

  const retryChunk = useCallback(async (chunkId: string) => {
    const chunk = chunks.find(c => c.id === chunkId)
    if (!chunk) return

    setChunks(prev => prev.map(c => 
      c.id === chunkId ? { ...c, isTranslating: true, error: undefined, translatedText: '' } : c
    ))

    try {
      const onUpdate = (id: string, content: string) => {
        setChunks(prev => prev.map(c => 
          c.id === id ? { ...c, translatedText: content } : c
        ))
      }

      await translateChunk(chunk.originalText, chunkId, onUpdate)

      setChunks(prev => prev.map(c => 
        c.id === chunkId ? { ...c, isTranslating: false } : c
      ))
    } catch (error) {
      setChunks(prev => prev.map(c => 
        c.id === chunkId ? { 
          ...c, 
          isTranslating: false,
          error: error instanceof Error ? error.message : 'Translation failed'
        } : c
      ))
    }
  }, [chunks, translateChunk])

  const getFullTranslation = useCallback(() => {
    return chunks.map(chunk => chunk.translatedText).join('\n\n')
  }, [chunks])

  const reset = useCallback(() => {
    setChunks([])
    setProgress({
      currentChunk: 0,
      totalChunks: 0,
      isComplete: true
    })
    setIsTranslating(false)
  }, [])

  return {
    chunks,
    progress,
    isTranslating,
    translateText,
    retryChunk,
    getFullTranslation,
    reset
  }
} 