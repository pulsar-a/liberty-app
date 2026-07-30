import { describe, expect, it } from 'vitest'
import { sanitizeBookHtml } from '../src/main/utils/sanitizeBookHtml'

describe('book HTML sanitization', () => {
  it('removes executable and embedded content', () => {
    const result = sanitizeBookHtml(`
      <script>alert('x')</script>
      <style>body { display: none }</style>
      <iframe src="https://example.com"></iframe>
      <form action="https://example.com"><input autofocus></form>
      <p onclick="alert('x')" style="position:fixed">Readable text</p>
    `)

    expect(result).toContain('<p>Readable text</p>')
    expect(result).not.toMatch(/script|style=|onclick|iframe|form|input/i)
  })

  it('keeps reader markup while restricting URLs', () => {
    const result = sanitizeBookHtml(`
      <h2 id="chapter">Chapter</h2>
      <a href="#note">Note</a>
      <a href="javascript:alert('x')">Unsafe</a>
      <img src="data:image/png;base64,AAAA" onerror="alert('x')" alt="Cover">
      <img src="file:///secret.txt">
    `)

    expect(result).toContain('<h2 id="chapter">Chapter</h2>')
    expect(result).toContain('href="#note"')
    expect(result).not.toContain('javascript:')
    expect(result).toContain('src="data:image/png;base64,AAAA"')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('file:///')
  })
})
