import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang, instructions, previousContext } = await request.json()

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text, targetLang' },
        { status: 400 }
      )
    }

    const apiKey = process.env.UPSTAGE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'UPSTAGE_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Convert language codes to full language names
    const languageMap: Record<string, string> = {
      'en': 'English',
      'ko': 'Korean', 
      'ja': 'Japanese'
    }
    
    const targetLanguageName = languageMap[targetLang] || targetLang

    // Construct the translation prompt with optional context
    let contextInstruction = ''
    if (previousContext) {
      contextInstruction = `\n\nFor consistency, here is the previous page translation context:
Previous source: "${previousContext.source}"
Previous translation: "${previousContext.translation}"

Please maintain consistent terminology, style, and flow with the previous translation.`
    }

    const systemPrompt = `You are a professional translator. Auto-detect the source language and translate the following text to ${targetLanguageName}. ${
      instructions ? `Additional instructions: ${instructions}` : ''
    }${contextInstruction}

    Rules:
    1. Maintain the original meaning and tone
    2. Preserve formatting and structure  
    3. Only return the translated text, no explanations
    4. If the text contains technical terms, preserve them when appropriate
    5. Auto-detect the source language - do not ask for clarification
    6. If previous context is provided, ensure consistency in terminology and style`



    const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'solar-pro2-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        stream: true,
        temperature: 0.3,
        max_tokens: 4000
      }),
    })

    if (!response.ok) {
      throw new Error(`Solar API error: ${response.status}`)
    }

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
} 