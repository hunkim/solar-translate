"use client"

import React from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return <span></span>

  // Simple markdown parsing for common elements
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let listItems: string[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []
    let tableRows: string[] = []

    const flushListItems = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-5 mb-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="mb-1">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        )
        listItems = []
      }
    }

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-gray-100 p-3 rounded mb-4 overflow-x-auto">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        )
        codeBlockContent = []
      }
    }

    const flushTable = () => {
      if (tableRows.length > 0) {
        // Parse table rows
        const parsedRows = tableRows.map(row =>
          row.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
        )

        // Check if second row is separator (contains dashes)
        const hasSeparator = parsedRows.length > 1 &&
          parsedRows[1].every(cell => /^[-:]+$/.test(cell))

        const headerRow = parsedRows[0]
        const bodyRows = hasSeparator ? parsedRows.slice(2) : parsedRows.slice(1)

        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300">
              {headerRow && (
                <thead className="bg-gray-100">
                  <tr>
                    {headerRow.map((cell, cellIdx) => (
                      <th key={cellIdx} className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">
                        {parseInlineMarkdown(cell.replace(/<br\s*\/?>/gi, '\n'))}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-line">
                        {parseInlineMarkdown(cell.replace(/<br\s*\/?>/gi, '\n'))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        tableRows = []
      }
    }

    // Check if a line is a table row
    const isTableRow = (line: string) => {
      const trimmed = line.trim()
      return trimmed.startsWith('|') && trimmed.endsWith('|')
    }

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock()
          inCodeBlock = false
        } else {
          flushListItems()
          flushTable()
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeBlockContent.push(line)
        return
      }

      // Handle table rows
      if (isTableRow(trimmedLine)) {
        flushListItems()
        tableRows.push(trimmedLine)
        return
      } else if (tableRows.length > 0) {
        // End of table
        flushTable()
      }

      // Handle headers
      if (trimmedLine.startsWith('# ')) {
        flushListItems()
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl font-bold mb-4 mt-6">
            {parseInlineMarkdown(trimmedLine.slice(2))}
          </h1>
        )
      } else if (trimmedLine.startsWith('## ')) {
        flushListItems()
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-bold mb-3 mt-5">
            {parseInlineMarkdown(trimmedLine.slice(3))}
          </h2>
        )
      } else if (trimmedLine.startsWith('### ')) {
        flushListItems()
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-bold mb-2 mt-4">
            {parseInlineMarkdown(trimmedLine.slice(4))}
          </h3>
        )
      }
      // Handle list items
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || /^\d+\.\s/.test(trimmedLine)) {
        const listContent = trimmedLine.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '')
        listItems.push(listContent)
      }
      // Handle horizontal rules
      else if (trimmedLine === '---' || trimmedLine === '***') {
        flushListItems()
        elements.push(<hr key={`hr-${index}`} className="border-gray-300 my-4" />)
      }
      // Handle empty lines
      else if (trimmedLine === '') {
        flushListItems()
        elements.push(<br key={`br-${index}`} />)
      }
      // Handle regular paragraphs
      else if (trimmedLine) {
        flushListItems()
        elements.push(
          <p key={`p-${index}`} className="mb-3">
            {parseInlineMarkdown(trimmedLine)}
          </p>
        )
      }
    })

    // Flush any remaining items
    flushListItems()
    flushCodeBlock()
    flushTable()

    return elements
  }

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    let result: React.ReactNode[] = []
    let lastIndex = 0

    // Collect all matches first
    const matches: Array<{ type: string, start: number, end: number, content: string, url?: string }> = []

    // Link matches [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let linkMatch: RegExpExecArray | null
    while ((linkMatch = linkRegex.exec(text)) !== null) {
      matches.push({
        type: 'link',
        start: linkMatch.index,
        end: linkMatch.index + linkMatch[0].length,
        content: linkMatch[1],
        url: linkMatch[2]
      })
    }

    // Bold matches **text**
    const boldRegex = /\*\*(.*?)\*\*/g
    let boldMatch: RegExpExecArray | null
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      matches.push({
        type: 'bold',
        start: boldMatch.index,
        end: boldMatch.index + boldMatch[0].length,
        content: boldMatch[1]
      })
    }

    // Italic text *text*
    const italicRegex = /\*(.*?)\*/g
    let italicMatch: RegExpExecArray | null
    while ((italicMatch = italicRegex.exec(text)) !== null) {
      // Don't match if it's part of a bold match
      const isPartOfBold = matches.some(m =>
        m.type === 'bold' && italicMatch!.index >= m.start && italicMatch!.index + italicMatch![0].length <= m.end
      )
      if (!isPartOfBold) {
        matches.push({
          type: 'italic',
          start: italicMatch.index,
          end: italicMatch.index + italicMatch[0].length,
          content: italicMatch[1]
        })
      }
    }

    // Inline code `code`
    const codeRegex = /`(.*?)`/g
    let codeMatch: RegExpExecArray | null
    while ((codeMatch = codeRegex.exec(text)) !== null) {
      matches.push({
        type: 'code',
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length,
        content: codeMatch[1]
      })
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start)

    // Remove overlapping matches (keep the first one)
    const cleanMatches = matches.filter((match, index) => {
      for (let i = 0; i < index; i++) {
        const prevMatch = matches[i]
        if (match.start < prevMatch.end) {
          return false
        }
      }
      return true
    })

    // Build the result
    cleanMatches.forEach((match, index) => {
      // Add text before this match
      if (match.start > lastIndex) {
        result.push(text.slice(lastIndex, match.start))
      }

      // Add the formatted match
      switch (match.type) {
        case 'link':
          result.push(
            <a
              key={`link-${index}`}
              href={match.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {match.content}
            </a>
          )
          break
        case 'bold':
          result.push(<strong key={`bold-${index}`}>{match.content}</strong>)
          break
        case 'italic':
          result.push(<em key={`italic-${index}`}>{match.content}</em>)
          break
        case 'code':
          result.push(
            <code key={`code-${index}`} className="bg-gray-100 px-1 py-0.5 rounded text-sm">
              {match.content}
            </code>
          )
          break
      }

      lastIndex = match.end
    })

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex))
    }

    return result.length > 0 ? result : text
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {parseMarkdown(content)}
    </div>
  )
} 