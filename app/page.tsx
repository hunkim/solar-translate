"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { chunkText, needsChunking } from "@/lib/textChunker"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"

import {
  Plus,
  X,
  Copy,
  Sparkles,
  Upload,
  Languages,
  Mail,
  Eraser,
  Settings,
  ChevronDown,
  HistoryIcon,
  RefreshCw,
  Trash,

} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
// Removed Dialog imports as they are no longer used

// A simple placeholder for the Google icon
const GoogleIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2">
    <title>Google</title>
    <path
      d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.386-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.85l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
      fill="#4285F4"
    />
  </svg>
)

// Target language configurations
const targetLanguages = [
  { value: "en", label: "English" },
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
]

// Available translation models
const translationModels = [
  { value: "solar-pro2-preview", label: "Solar Pro2 Preview" },
  { value: "solar-mini", label: "Solar Mini" },
]

// Mock data for history
const mockHistoryItems = [
  { id: "1", title: "Project Alpha - Document 1", date: "2025-06-15" },
  { id: "2", title: "Default - Quick Translation", date: "2025-06-14" },
  { id: "3", title: "Project Beta - Marketing Copy", date: "2025-06-13" },
]

export default function SolarTranslatePage() {
  const { toast } = useToast()
  const [targetLang, setTargetLang] = useState("ko")
  const [sourcePages, setSourcePages] = useState([""])
  const [translatedPages, setTranslatedPages] = useState([""])
  // Removed activeNav state
  const [translationInstructions, setTranslationInstructions] = useState("")
  const [instructionName, setInstructionName] = useState("")
  const [selectedModel, setSelectedModel] = useState("solar-pro2-preview")
  const [historyItems, setHistoryItems] = useState(mockHistoryItems)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [currentProjectName, setCurrentProjectName] = useState<string | null>("New Project")
  const [savedInstructionSets, setSavedInstructionSets] = useState([
    { id: "instr1", name: "Formal Tone", instructions: "Maintain a formal tone throughout.", model: "solar-large" },
    {
      id: "instr2",
      name: "Casual Blog Post",
      instructions: "Use a casual, friendly tone. Include emojis.",
      model: "solar-mini",
    },
  ])
  // Add state to track when chunking has occurred and needs auto-translation
  const [pendingAutoTranslation, setPendingAutoTranslation] = useState<{startIndex: number, pageCount: number} | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    stage: 'idle' | 'uploading' | 'processing' | 'extracting' | 'translating'
    message: string
    filename?: string
  }>({
    stage: 'idle',
    message: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Add AbortController ref to cancel ongoing translations
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Function to detect if content contains markdown
  const isMarkdownContent = (text: string): boolean => {
    if (!text) return false
    
    // Check for common markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s/m,           // Headers: # ## ### etc
      /\*\*.*?\*\*/,          // Bold: **text**
      /\*.*?\*/,              // Italic: *text*
      /`.*?`/,                // Inline code: `code`
      /^```/m,                // Code blocks: ```
      /^[-*+]\s/m,            // Lists: - * +
      /^\d+\.\s/m,            // Numbered lists: 1. 2.
      /^>\s/m,                // Blockquotes: >
      /^---+$/m,              // Horizontal rules: ---
    ]
    
    return markdownPatterns.some(pattern => pattern.test(text))
  }
  
  // Markdown content renderer (simple plain text with preserved line breaks)
  const renderContent = (content: string): React.JSX.Element => {
    if (!content) return <span></span>
    
    // Render markdown/plain text with preserved line breaks
    return (
      <span style={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </span>
    )
  }

  const handleTargetLanguageChange = (newTargetLang: string) => {
    // Cancel any ongoing translations immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    setTargetLang(newTargetLang)
    
    // Clear all current translations since language changed
    setTranslatedPages(sourcePages.map(() => ""))
    
    // Show toast notification about language change
    toast({
      title: "Language changed",
      description: `Target language changed to ${targetLanguages.find(lang => lang.value === newTargetLang)?.label}. Previous translations cleared.`,
      duration: 3000,
    })
    
    // Trigger auto-translation for existing content after a short delay
    setTimeout(() => {
      sourcePages.forEach((page, index) => {
        if (page.trim() && page.split(/\s+/).length > 3) {
          translateText(page, index, newTargetLang)
        }
      })
    }, 100)
  }

  const handleAddPage = () => {
    setSourcePages([...sourcePages, ""])
    setTranslatedPages([...translatedPages, ""])
  }

  const handleErasePage = (index: number) => {
    const newSourcePages = [...sourcePages]
    const newTranslatedPages = [...translatedPages]
    newSourcePages[index] = ""
    newTranslatedPages[index] = ""
    setSourcePages(newSourcePages)
    setTranslatedPages(newTranslatedPages)
  }

  const handleRemovePage = (index: number) => {
    const hasContent = sourcePages[index].trim() || translatedPages[index].trim()
    
    if (hasContent) {
      toast({
        title: "Cannot delete page",
        description: "Please clear the content first using the erase button, then try deleting.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    
    setSourcePages(sourcePages.filter((_, i) => i !== index))
    setTranslatedPages(translatedPages.filter((_, i) => i !== index))
  }

  const handleSourceChange = (index: number, value: string) => {
    // Check if we need to chunk the text (>500 words)
    if (needsChunking(value, 500)) {
      handleLongTextChunking(index, value)
      return
    }

    const newSourcePages = [...sourcePages]
    newSourcePages[index] = value
    setSourcePages(newSourcePages)

    // Auto-translate if text is substantial (>3 words)
    if (value.trim() && value.split(/\s+/).length > 3) {
      translateText(value, index)
    } else {
      // Clear translation for short text
      const newTranslatedPages = [...translatedPages]
      newTranslatedPages[index] = ""
      setTranslatedPages(newTranslatedPages)
    }
  }

  const handleLongTextChunking = (pastePageIndex: number, longText: string) => {
    // Chunk the text into ~500 word pieces at sentence boundaries
    const chunks = chunkText(longText, 500)
    
    // Calculate how many new pages we need
    const pagesNeeded = chunks.length
    const currentPageCount = sourcePages.length
    const additionalPagesNeeded = Math.max(0, pagesNeeded - (currentPageCount - pastePageIndex))
    
    // Create new source and translated pages arrays
    const newSourcePages = [...sourcePages]
    const newTranslatedPages = [...translatedPages]
    
    // Add additional pages if needed for the chunks
    for (let i = 0; i < additionalPagesNeeded; i++) {
      newSourcePages.push("")
      newTranslatedPages.push("")
    }
    
    // Place chunks into pages:
    // - First chunk (chunks[0]) stays in the page where user pasted (pastePageIndex)
    // - Second chunk (chunks[1]) goes to next page (pastePageIndex + 1)  
    // - Third chunk (chunks[2]) goes to page after that (pastePageIndex + 2)
    // - And so on...
    chunks.forEach((chunk, chunkIndex) => {
      const targetPageIndex = pastePageIndex + chunkIndex
      newSourcePages[targetPageIndex] = chunk
      newTranslatedPages[targetPageIndex] = "" // Clear existing translations
    })
    
    // Clear any remaining pages that were previously filled beyond our chunks
    for (let i = pastePageIndex + chunks.length; i < currentPageCount; i++) {
      newSourcePages[i] = ""
      newTranslatedPages[i] = ""
    }
    
    // Update state
    setSourcePages(newSourcePages)
    setTranslatedPages(newTranslatedPages)
    
    // Set pending auto-translation to be triggered by useEffect after state update
    setPendingAutoTranslation({ startIndex: pastePageIndex, pageCount: chunks.length })

    // Show feedback to user
    toast({
      title: "Text automatically chunked",
      description: `Long text split into ${chunks.length} pages (~500 words each). First chunk remains in Page ${pastePageIndex + 1}.`,
      duration: 4000,
    })
  }

  const translateText = async (text: string, pageIndex: number, overrideTargetLang?: string): Promise<void> => {
    if (!text.trim()) return

    // Cancel any previous translation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this translation
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Use the override target language if provided, otherwise use current state
    const currentTargetLang = overrideTargetLang || targetLang

    // Get previous page context for consistency (if exists)
    let previousContext = null
    if (pageIndex > 0 && sourcePages[pageIndex - 1]?.trim() && translatedPages[pageIndex - 1]?.trim()) {
      previousContext = {
        source: sourcePages[pageIndex - 1],
        translation: translatedPages[pageIndex - 1]
      }
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang: currentTargetLang,
          instructions: translationInstructions,
          previousContext,
        }),
        signal: abortController.signal,
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
                  // Use functional update to preserve other pages' translations
                  setTranslatedPages(prevPages => {
                    const newPages = [...prevPages]
                    newPages[pageIndex] = accumulated
                    return newPages
                  })
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      // Don't show error for aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Translation aborted')
        return
      }
      
      console.error('Translation error:', error)
      // Use functional update for error case too
      setTranslatedPages(prevPages => {
        const newPages = [...prevPages]
        newPages[pageIndex] = 'Translation failed. Please try again.'
        return newPages
      })
      throw error // Re-throw to be caught by sequential translation
    } finally {
      // Clear the abort controller if this was the active one
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }

  const translatePagesSequentially = useCallback(async (startIndex: number, pageCount: number, overrideTargetLang?: string) => {
    for (let i = startIndex; i < startIndex + pageCount && i < sourcePages.length; i++) {
      const page = sourcePages[i]
      if (page.trim()) {
        try {
          await translateText(page, i, overrideTargetLang)
        } catch (error) {
          console.error(`Failed to translate page ${i + 1}:`, error)
          // Continue with next page even if one fails
        }
      }
    }
  }, [sourcePages, targetLang, translationInstructions])

  // Auto-translate after chunking when state has been updated
  useEffect(() => {
    if (pendingAutoTranslation) {
      const { startIndex, pageCount } = pendingAutoTranslation
      setPendingAutoTranslation(null) // Clear the pending state
      
      // Start sequential translation
      translatePagesSequentially(startIndex, pageCount)
    }
  }, [pendingAutoTranslation, translatePagesSequentially])

  const copyAllToClipboard = () => {
    const allText = translatedPages.join("\n\n")
    navigator.clipboard.writeText(allText)
  }

  const copyPageToClipboard = (index: number) => {
    navigator.clipboard.writeText(translatedPages[index])
  }

  const handleManualTranslate = (index: number) => {
    const text = sourcePages[index]
    if (text.trim()) {
      translateText(text, index)
    }
  }

  const retranslateAll = () => {
    // Cancel any ongoing translations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    // Clear all translations first
    setTranslatedPages(sourcePages.map(() => ""))
    
    // Find all pages with content and translate them sequentially
    const pagesToTranslate = sourcePages
      .map((page, index) => ({ page, index }))
      .filter(({ page }) => page.trim())
    
    if (pagesToTranslate.length > 0) {
      translatePagesSequentially(0, sourcePages.length)
    }
  }

  const handleClearAll = () => {
    setSourcePages([""])
    setTranslatedPages([""])
    toast({
      title: "All pages cleared",
      description: "All source text and translations have been cleared.",
      duration: 3000,
    })
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress({
      stage: 'uploading',
      message: `Uploading ${file.name}...`,
      filename: file.name
    })
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Add minimum delay to show uploading stage
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update progress to processing
      setUploadProgress({
        stage: 'processing',
        message: `Processing ${file.name}...`,
        filename: file.name
      })
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      // Add minimum delay to show processing stage
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Update progress to extracting
      setUploadProgress({
        stage: 'extracting',
        message: `Extracting content from ${file.name}...`,
        filename: file.name
      })
      
      const result = await response.json()
      
      // Add minimum delay to show extracting stage
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }
      
      if (result.isMultiPage && result.pages) {
        // Handle page-based content from Document Parse
        setUploadProgress({
          stage: 'translating',
          message: `Setting up ${result.pages.length} pages for translation...`,
          filename: file.name
        })
        handleMultiPageUpload(result.pages, result.filename)
      } else {
        // Handle single content (txt files or fallback)
        const content = result.content || ""
        if (content && needsChunking(content, 500)) {
          // Use chunking logic for long documents
          setUploadProgress({
            stage: 'translating',
            message: `Chunking long document and preparing for translation...`,
            filename: file.name
          })
          handleLongTextChunking(0, content)
        } else {
          // For shorter documents, just put in first page
          const newSourcePages = [...sourcePages]
          const newTranslatedPages = [...translatedPages]
          newSourcePages[0] = content
          newTranslatedPages[0] = ""
          setSourcePages(newSourcePages)
          setTranslatedPages(newTranslatedPages)
          
          // Auto-translate if content is substantial
          if (content.trim() && content.split(/\s+/).length > 3) {
            setUploadProgress({
              stage: 'translating',
              message: `Starting translation...`,
              filename: file.name
            })
            translateText(content, 0)
          }
        }
        
        toast({
          title: "Document uploaded successfully",
          description: `Extracted text from ${file.name}. ${content && needsChunking(content, 500) ? 'Long document was automatically chunked.' : content ? '' : 'No text was found in the image.'}`,
          duration: 4000,
        })
      }
      
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process the document. Please try again.",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setIsUploading(false)
      setUploadProgress({
        stage: 'idle',
        message: ''
      })
    }
  }

  const handleMultiPageUpload = (pages: any[], filename: string) => {
    // Create enough pages to accommodate all document pages
    const maxPageNumber = Math.max(...pages.map(p => p.pageNumber))
    const pagesNeeded = Math.max(maxPageNumber, pages.length)
    
    // Initialize arrays with enough pages
    const newSourcePages = Array(pagesNeeded).fill("")
    const newTranslatedPages = Array(pagesNeeded).fill("")
    
    // Place content in the correct pages based on page numbers
    pages.forEach((page) => {
      const pageIndex = page.pageNumber - 1 // Convert to 0-based index
      if (pageIndex >= 0 && pageIndex < pagesNeeded) {
        newSourcePages[pageIndex] = page.content
      }
    })
    
    // Update state
    setSourcePages(newSourcePages)
    setTranslatedPages(newTranslatedPages)
    
    // Count pages that will be auto-translated
    const pagesToTranslate = pages.filter(page => 
              page.content.trim() && page.content.split(/\s+/).length > 3
    ).length
    
    if (pagesToTranslate > 0) {
      setUploadProgress({
        stage: 'translating',
        message: `Starting auto-translation for ${pagesToTranslate} pages...`,
        filename: filename
      })
    }
    
    // Auto-translate pages with substantial content
    pages.forEach((page, index) => {
      const pageIndex = page.pageNumber - 1
      if (pageIndex >= 0 && page.content.trim() && page.content.split(/\s+/).length > 3) {
        // Add a small delay between translations to show progress
        setTimeout(() => {
          translateText(page.content, pageIndex)
        }, index * 100)
      }
    })
    
    toast({
      title: "Multi-page document uploaded successfully", 
      description: `Extracted ${pages.length} pages. Content placed in corresponding pages.${pagesToTranslate > 0 ? ` Auto-translating ${pagesToTranslate} pages...` : ''}`,
      duration: 4000,
    })
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset the input so the same file can be uploaded again
    event.target.value = ''
  }

  const handleGoogleSignIn = () => {
    // Placeholder for Google Sign-In logic
    console.log("Attempting Google Sign-In...")
    // Example: window.location.href = '/api/auth/google'; // Or use NextAuth.js signIn()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-violet-100/50 border-b border-violet-200/80 px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-violet-600" />
            <h1 className="text-xl font-semibold text-slate-800">Solar Translate Beta</h1>
          </div>
          <div className="text-center max-w-2xl">
            <p className="font-serif text-lg text-slate-700 mb-2">Translate and Edit in Your Style for Perfect Results</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              🔑 Get your API key at{" "}
              <a 
                href="https://console.upstage.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
              >
                Upstage Console
              </a>
              {" "}• 🐛 Report issues at{" "}
              <a 
                href="https://github.com/hunkim/solar-translate/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
              >
                GitHub Issues
              </a>
              {" "}• 🏢 For enterprise use, contact{" "}
              <a 
                href="https://upstage.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
              >
                Upstage
              </a>
            </p>
          </div>
          <Button variant="outline" disabled>
            <GoogleIcon />
            Login (Coming Soon)
          </Button>
        </div>
      </header>

      <div className="flex-grow p-4">

        {/* Main content area now a flex column to stack config editor and translation panes */}
        <div className="flex flex-col gap-4">
          <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Translation Instructions
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isConfigOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Set Translation Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="translationInstructions"
                        className="block text-sm font-medium text-slate-700 mb-1"
                      >
                        Instructions
                      </label>
                      <Textarea
                        id="translationInstructions"
                        placeholder="e.g., Maintain a formal tone, translate brand names as X, avoid using specific jargon..."
                        value={translationInstructions}
                        onChange={(e) => setTranslationInstructions(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="instructionName" className="block text-sm font-medium text-slate-700 mb-1">
                        Name
                      </label>
                      <Input
                        id="instructionName"
                        placeholder="e.g., Formal Tone Instructions"
                        value={instructionName}
                        onChange={(e) => setInstructionName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="selectedModel" className="block text-sm font-medium text-slate-700 mb-1">
                        Model
                      </label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger id="selectedModel">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {translationModels.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Original two-column layout for translation */}
          <main className="grid grid-cols-2 gap-4 flex-grow">
            {/* Source Column */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleAddPage}>
                      + Page
                    </Button>
                    <Button variant="outline" onClick={handleUploadClick} disabled={isUploading}>
                      <Upload className="h-4 w-4 mr-2" /> 
                      {isUploading ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full"></div>
                          {uploadProgress.stage === 'uploading' && 'Uploading...'}
                          {uploadProgress.stage === 'processing' && 'Processing...'}
                          {uploadProgress.stage === 'extracting' && 'Extracting...'}
                          {uploadProgress.stage === 'translating' && 'Translating...'}
                        </span>
                      ) : 'Upload'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,image/*,.pdf,.docx,.pptx,.xlsx,.hwp,.hwpx"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleClearAll}>
                      <Trash className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
                
                {/* Upload Progress Indicator */}
                {isUploading && uploadProgress.stage !== 'idle' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-blue-900">
                          {uploadProgress.message}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {uploadProgress.stage === 'uploading' && 'Sending file to server...'}
                          {uploadProgress.stage === 'processing' && 'Analyzing document format and structure...'}
                          {uploadProgress.stage === 'extracting' && 'Converting document to text using AI...'}
                          {uploadProgress.stage === 'translating' && 'Preparing content for translation...'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-2 bg-blue-100 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: uploadProgress.stage === 'uploading' ? '25%' :
                                 uploadProgress.stage === 'processing' ? '50%' :
                                 uploadProgress.stage === 'extracting' ? '75%' :
                                 uploadProgress.stage === 'translating' ? '90%' : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 flex-grow">
                {sourcePages.map((page, index) => (
                  <Card key={index} className="flex flex-col">
                    <Textarea
                      value={page}
                      onChange={(e) => handleSourceChange(index, e.target.value)}
                      placeholder="Type or paste your text here to translate..."
                      className="resize-none border-0 focus-visible:ring-0"
                      style={{ height: '330px' }}
                      rows={16}
                    />
                    <div className="flex items-center justify-between p-2 border-t bg-slate-50">
                      <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        - {index + 1} -
                      </span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-2 text-xs"
                          onClick={() => handleManualTranslate(index)}
                          disabled={!sourcePages[index].trim()}
                          title="Translate this page manually"
                        >
                          <Languages className="h-3 w-3 mr-1" />
                          Translate
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-slate-500 hover:text-slate-800"
                          onClick={() => handleErasePage(index)}
                          title="Clear this page"
                        >
                          <Eraser className="h-4 w-4" />
                        </Button>
                        {(index > 0 || sourcePages.length > 1) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-slate-800"
                            onClick={() => handleRemovePage(index)}
                            title="Delete this page"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button variant="outline" onClick={handleAddPage}>
                + Page
              </Button>
            </div>

            {/* Target Column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">Translate to</span>
                  <Select value={targetLang} onValueChange={handleTargetLanguageChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetLanguages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={retranslateAll}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retranslate All
                  </Button>
                  <Button variant="outline" onClick={copyAllToClipboard}>
                    Copy all
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 flex-grow">
                {translatedPages.map((page, index) => {
                  const hasMarkdown = isMarkdownContent(page)
                  
                  return (
                    <Card key={index} className="flex flex-col bg-slate-100/70">
                      {hasMarkdown ? (
                        <div 
                          className="p-3 min-h-[330px] max-h-[330px] overflow-y-auto border-0 bg-transparent"
                          style={{ 
                            fontSize: '14px',
                            lineHeight: '1.5',
                          }}
                        >
                          {page ? (
                            <MarkdownRenderer content={page} />
                          ) : (
                            <span className="text-slate-400 italic">Translation...</span>
                          )}
                        </div>
                      ) : (
                        <Textarea
                          value={page}
                          readOnly
                          placeholder="Translation..."
                          className="resize-none border-0 focus-visible:ring-0 bg-transparent"
                          style={{ height: '330px' }}
                          rows={16}
                        />
                      )}
                      <div className="flex items-center justify-between p-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Markdown
                          </span>
                          {hasMarkdown && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Auto-Rendered
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-800">
                            <Languages className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-slate-800"
                            onClick={() => copyPageToClipboard(index)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="border-t bg-slate-50/50 px-6 py-4 mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-4">
                <span>Solar Translate - AI-Powered Document Translation</span>
              </div>
              <div className="flex items-center gap-6">
                <a 
                  href="https://github.com/hunkim/solar-translate/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Feedback
                </a>
                <a 
                  href="https://console.upstage.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Get API Key
                </a>
                <a 
                  href="https://upstage.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Upstage
                </a>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 text-center">
              For private, internal use of this translation service, please contact us at{" "}
              <a 
                href="https://upstage.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-slate-700"
              >
                Upstage Homepage
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
