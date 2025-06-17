"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { useTranslation, TranslationChunk } from "@/hooks/useTranslation"
import { countWords, needsChunking } from "@/lib/textChunker"

interface TranslationSectionProps {
  sourceLang: string
  targetLang: string
  instructions?: string
  sourceText: string
  onSourceTextChange: (text: string) => void
  onTranslatedTextChange: (text: string) => void
}

export function TranslationSection({
  sourceLang,
  targetLang,
  instructions,
  sourceText,
  onSourceTextChange,
  onTranslatedTextChange
}: TranslationSectionProps) {
  const { 
    chunks, 
    progress: translationProgress, 
    isTranslating, 
    translateText, 
    retryChunk, 
    getFullTranslation, 
    reset 
  } = useTranslation({ sourceLang, targetLang, instructions })

  const [translatedText, setTranslatedText] = useState("")
  const [progress, setProgress] = useState(0)

  const handleTranslate = async () => {
    if (!sourceText.trim()) return
    
    reset()
    setTranslatedText("")
    setProgress(0)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang,
          targetLang,
          instructions,
        }),
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let accumulated = ''

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
                  accumulated += parsed.content
                  setTranslatedText(accumulated)
                  onTranslatedTextChange(accumulated)
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Translation error:', error)
      setTranslatedText('Translation failed. Please try again.')
    } finally {
      setProgress(100)
    }
  }

  // Update translated text when chunks change
  useEffect(() => {
    const fullTranslation = getFullTranslation()
    setTranslatedText(fullTranslation)
    onTranslatedTextChange(fullTranslation)
  }, [chunks, getFullTranslation, onTranslatedTextChange])

  const wordCount = countWords(sourceText)
  const willBeChunked = needsChunking(sourceText, 500)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText)
  }

  return (
    <div className="space-y-4">
      {/* Source Text Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Source Text</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{wordCount} words</Badge>
              {willBeChunked && (
                <Badge variant="secondary">Will be chunked</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to translate..."
            value={sourceText}
            onChange={(e) => onSourceTextChange(e.target.value)}
            className="min-h-[200px] resize-none"
            disabled={isTranslating}
          />
          <div className="flex justify-between items-center mt-4">
            <Button 
              onClick={handleTranslate}
              disabled={!sourceText.trim() || isTranslating}
              className="flex items-center gap-2"
            >
              {isTranslating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                "Translate"
              )}
            </Button>
            
            {willBeChunked && (
              <div className="text-sm text-muted-foreground">
                Text will be split into ~{Math.ceil(wordCount / 500)} chunks
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Translation Progress */}
      {isTranslating && (
        <Card>
          <CardHeader>
            <CardTitle>Translation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} />
          </CardContent>
        </Card>
      )}

      {/* Translated Text Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Translated Text</span>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              disabled={!translatedText}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Translation will appear here..."
            value={translatedText}
            onChange={(e) => {
              setTranslatedText(e.target.value)
              onTranslatedTextChange(e.target.value)
            }}
            className="min-h-[200px] resize-none"
            readOnly={isTranslating}
          />
        </CardContent>
      </Card>
    </div>
  )
}

interface ChunkStatusProps {
  chunk: TranslationChunk
  index: number
  onRetry: () => void
}

function ChunkStatus({ chunk, index, onRetry }: ChunkStatusProps) {
  const getStatusIcon = () => {
    if (chunk.error) return <AlertCircle className="h-4 w-4 text-destructive" />
    if (chunk.isTranslating) return <RefreshCw className="h-4 w-4 animate-spin text-primary" />
    if (chunk.translatedText) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <div className="h-4 w-4 rounded-full bg-muted" />
  }

  return (
    <div className="flex items-center justify-between p-2 border rounded">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">Chunk {index + 1}</span>
        <Badge variant="outline" className="text-xs">
          {chunk.wordCount} words
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        {chunk.error && (
          <>
            <Alert className="flex-1 py-1">
              <AlertDescription className="text-xs">
                {chunk.error}
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </>
        )}
        
        {chunk.isTranslating && (
          <span className="text-xs text-muted-foreground">
            Translating...
          </span>
        )}
        
        {chunk.translatedText && !chunk.isTranslating && (
          <span className="text-xs text-green-600">
            Complete
          </span>
        )}
      </div>
    </div>
  )
} 