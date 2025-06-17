import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimiter'

// Create rate limiter for uploads
const uploadLimiter = rateLimit(RATE_LIMITS.upload)

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request)
    const { allowed, resetTime, remaining } = uploadLimiter(clientIP)
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Too many upload requests. Please try again later.',
          resetTime: resetTime ? new Date(resetTime).toISOString() : undefined
        },
        { 
          status: 429,
          headers: {
            'Retry-After': resetTime ? Math.ceil((resetTime - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Limit': RATE_LIMITS.upload.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime ? resetTime.toString() : ''
          }
        }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 50MB limit. Please upload a smaller file.' 
      }, { status: 400 })
    }

    // Handle .txt files directly
    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      try {
        const textContent = await file.text()
        
        if (!textContent.trim()) {
          return NextResponse.json({ 
            error: 'The text file is empty.' 
          }, { status: 400 })
        }

        return NextResponse.json({ 
          content: textContent,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      } catch (error) {
        console.error('Error reading text file:', error)
        return NextResponse.json({ 
          error: 'Failed to read the text file.' 
        }, { status: 500 })
      }
    }

    // Check if file is supported by Upstage Document Parse
    const supportedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/heic',
      // Documents
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      // HWP formats (Hancom Office)
      'application/x-hwp', // HWP
      'application/vnd.hancom.hwpx', // HWPX
    ]
    
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Supported formats: TXT, JPEG, PNG, BMP, PDF, TIFF, HEIC, DOCX, PPTX, XLSX, HWP, HWPX.' 
      }, { status: 400 })
    }

    // Prepare form data for Upstage API
    const upstageFormData = new FormData()
    upstageFormData.append('document', file)
    upstageFormData.append('output_formats', '["markdown"]')
    upstageFormData.append('base64_encoding', '["table"]')
    upstageFormData.append('ocr', 'auto')
    upstageFormData.append('coordinates', 'false')
    upstageFormData.append('model', 'document-parse')

    // Call Upstage Document Parse API
    const response = await fetch('https://api.upstage.ai/v1/document-digitization', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTAGE_API_KEY}`,
      },
      body: upstageFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Upstage API error:', errorText)
      return NextResponse.json({ 
        error: 'Document parsing failed. Please try again.' 
      }, { status: 500 })
    }

    const result = await response.json()
    

    
    // First try to use the main content if available
    if (result.content && (result.content.markdown || result.content.text)) {
      const markdownContent = result.content.markdown || result.content.text || ''
      
      if (markdownContent.trim()) {
        return NextResponse.json({ 
          content: markdownContent,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          isMultiPage: false
        })
      }
    }
    
    // Check if we have elements with page numbers (Upstage Document Parse format)
    if (result.elements && Array.isArray(result.elements)) {
      // Group elements by page number
      const pageGroups: { [pageNumber: number]: any[] } = {}
      
      result.elements.forEach((element: any) => {
        const pageNum = element.page || 1
        if (!pageGroups[pageNum]) {
          pageGroups[pageNum] = []
        }
        pageGroups[pageNum].push(element)
      })
      
      // Convert grouped elements to pages with combined content
      const pages = Object.keys(pageGroups)
        .map(pageNumStr => parseInt(pageNumStr))
        .sort((a, b) => a - b)
        .map(pageNum => {
          const elements = pageGroups[pageNum]
          const content = elements
            .map(el => el.content?.markdown || el.content?.text || '')
            .filter(text => text.trim())
            .join('\n\n')
          
          return {
            pageNumber: pageNum,
            content: content,
            metadata: {
              page: pageNum,
              elementCount: elements.length,
              totalPages: result.usage?.pages || Object.keys(pageGroups).length
            }
          }
        })
        .filter(page => page.content.trim())
      
      if (pages.length === 0) {
        return NextResponse.json({ 
          error: 'No text content could be extracted from the document.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        pages: pages,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        isMultiPage: pages.length > 1,
        totalPages: result.usage?.pages || pages.length
      })
    } 
    // Check if we have page-based content (alternative format)
    else if (result.content && Array.isArray(result.content)) {
      // Handle page-based response
      const pages = result.content.map((page: any, index: number) => ({
        pageNumber: page.page || index + 1,
        content: page.markdown || page.text || '',
        metadata: {
          page: page.page,
          bbox: page.bbox,
          category: page.category
        }
      })).filter((page: any) => page.content.trim())
      
      if (pages.length === 0) {
        return NextResponse.json({ 
          error: 'No text content could be extracted from the document.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        pages: pages,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        isMultiPage: true
      })
    } else {
      // Handle single content response (fallback)
      const markdownContent = result.content?.markdown || result.content?.text || ''
      
      if (!markdownContent.trim()) {
        return NextResponse.json({ 
          error: 'No text content could be extracted from the document.' 
        }, { status: 400 })
      }

      return NextResponse.json({ 
        content: markdownContent,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        isMultiPage: false
      })
    }

  } catch (error) {
    console.error('Upload processing error:', error)
    return NextResponse.json({ 
      error: 'An error occurred while processing the document.' 
    }, { status: 500 })
  }
} 