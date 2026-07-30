import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('Electron reader security', () => {
  it('keeps the BrowserWindow sandboxed and does not bypass CSP', () => {
    const source = fs.readFileSync(path.join(root, 'src/main/index.ts'), 'utf8')

    expect(source).toContain('sandbox: true')
    expect(source).toContain('contextIsolation: true')
    expect(source).toContain('nodeIntegration: false')
    expect(source).toContain('webSecurity: true')
    expect(source).not.toContain('bypassCSP')
    expect(source).not.toContain('liberty-file')
  })

  it('blocks publication scripts and unsafe document capabilities in CSP', () => {
    const html = fs.readFileSync(path.join(root, 'src/renderer/index.html'), 'utf8')

    expect(html).toContain("script-src 'self' 'wasm-unsafe-eval'")
    expect(html).toContain("object-src 'none'")
    expect(html).toContain("base-uri 'none'")
    expect(html).not.toMatch(/script-src[^;]*blob:/)
  })
})
