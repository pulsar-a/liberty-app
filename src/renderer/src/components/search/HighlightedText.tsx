import React from 'react'

interface HighlightedTextProps {
  text: string
  highlight: string
  className?: string
  highlightClassName?: string
}

/**
 * Component that highlights matching substrings in text (case-insensitive)
 * The original text case is preserved in the output
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlight,
  className = '',
  highlightClassName = 'bg-amber-200 dark:bg-amber-500/40 text-amber-900 dark:text-amber-100 rounded px-0.5',
}) => {
  if (!highlight || !highlight.trim()) {
    return <span className={className}>{text}</span>
  }

  // Use capturing group to split while keeping the matched parts
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi')
  const parts = text.split(regex)

  // Compare case-insensitively to determine if part is a match
  // This preserves the original case of the matched text
  const highlightLower = highlight.toLowerCase()

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlightLower ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  )
}

// Helper to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

