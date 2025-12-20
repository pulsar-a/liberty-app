# Liberty Reader - WASM Reader API Reference

This document provides a comprehensive reference for the Liberty Reader's WebAssembly-based e-book rendering engine.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [JavaScript/TypeScript API](#javascripttypescript-api)
  - [Initialization](#initialization)
  - [Font Management](#font-management)
  - [Book Loading](#book-loading)
  - [Pagination](#pagination)
  - [Rendering](#rendering)
  - [Search](#search)
  - [Text Selection](#text-selection)
  - [Performance](#performance)
- [Rust/WASM API](#rustwasm-api)
- [Data Types](#data-types)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

---

## Overview

The Liberty Reader WASM module is a Rust-based e-book rendering engine compiled to WebAssembly. It provides:

- **Deterministic text layout**: Unlike browser-based rendering, the WASM module controls exactly where lines break and how text flows
- **Cross-platform consistency**: Same book with same settings produces identical page counts on all platforms
- **Canvas-based rendering**: Renders text directly to a pixel buffer for display on an HTML canvas
- **Full typography control**: Custom fonts, precise spacing, hyphenation support

### Why WASM?

| Aspect | Browser (HTML/CSS) | WASM Canvas |
|--------|-------------------|-------------|
| Line break position | Browser decides | We decide |
| Text height | Measure after render | Known before render |
| Cross-platform | Varies by OS/browser | Identical everywhere |
| Font substitution | Browser may substitute | We control font loading |
| Pagination determinism | No guarantee | **Guaranteed** |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Window                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React UI (unchanged)                      │  │
│  │  - Library view                                        │  │
│  │  - Settings panels                                     │  │
│  │  - Navigation controls                                 │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │              <canvas id="reader-canvas">               │  │
│  │    ┌─────────────────────────────────────────────┐    │  │
│  │    │         Rust/WASM Rendering Engine          │    │  │
│  │    │                                             │    │  │
│  │    │  1. Parse EPUB HTML → Layout Model          │    │  │
│  │    │  2. Calculate pagination (deterministic)    │    │  │
│  │    │  3. Render pixels to buffer                 │    │  │
│  │    │  4. Transfer to canvas                      │    │  │
│  │    └─────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Book Loading**: EPUB parsed → `BookContent` JSON → WASM `LayoutDocument`
2. **Pagination**: `LayoutDocument` + Settings + Dimensions → `PaginatedBook`
3. **Rendering**: Page request → RGBA pixel buffer → Canvas `ImageData`

---

## JavaScript/TypeScript API

The TypeScript API is provided through `WasmReaderService.ts`. Import it as:

```typescript
import {
  initWasmReader,
  loadBundledFonts,
  loadBook,
  paginateBook,
  renderPage,
  // ... other functions
} from '../services/WasmReaderService'
```

### Initialization

#### `initWasmReader()`

Initialize the WASM module. Must be called before any other functions.

```typescript
async function initWasmReader(): Promise<void>
```

**Example:**
```typescript
await initWasmReader()
console.log('WASM Reader initialized')
```

**Notes:**
- Idempotent - safe to call multiple times
- Sets up error panic hook for better debugging
- Automatically called by other functions if needed

#### `isInitialized()`

Check if the WASM module is ready.

```typescript
function isInitialized(): boolean
```

---

### Font Management

#### `loadBundledFonts(fonts?)`

Load font files into the WASM module for rendering.

```typescript
async function loadBundledFonts(fonts?: FontToLoad[]): Promise<void>
```

**Parameters:**
- `fonts` - Optional array of fonts to load. Defaults to `DEFAULT_READER_FONTS` (Literata family)

**Default Fonts:**
```typescript
const DEFAULT_READER_FONTS: FontToLoad[] = [
  { name: 'Literata', url: '/fonts/reading/Literata_18pt-Regular.ttf' },
  { name: 'Literata-Bold', url: '/fonts/reading/Literata_18pt-Bold.ttf' },
  { name: 'Literata-Italic', url: '/fonts/reading/Literata_18pt-Italic.ttf' },
  { name: 'Literata-BoldItalic', url: '/fonts/reading/Literata_18pt-BoldItalic.ttf' },
]
```

**Font Naming Convention:**
- Base font: `"FamilyName"` (treated as Regular)
- Variants: `"FamilyName-Bold"`, `"FamilyName-Italic"`, `"FamilyName-BoldItalic"`

#### `loadCustomFont(name, url)`

Load a custom font at runtime.

```typescript
async function loadCustomFont(name: string, url: string): Promise<void>
```

**Example:**
```typescript
await loadCustomFont('Georgia', '/fonts/Georgia.ttf')
await loadCustomFont('Georgia-Bold', '/fonts/Georgia-Bold.ttf')
```

#### `areFontsLoaded()`

Check if default fonts have been loaded.

```typescript
function areFontsLoaded(): boolean
```

---

### Book Loading

#### `loadBook(content)`

Load book content into the reader for rendering.

```typescript
function loadBook(content: BookContent): WasmLoadBookResult
```

**Parameters:**
- `content` - Book content object with chapters

**BookContent Structure:**
```typescript
interface BookContent {
  chapters: Array<{
    id: string
    title: string
    htmlContent: string  // HTML content of the chapter
  }>
}
```

**Returns:**
```typescript
interface WasmLoadBookResult {
  loaded: boolean
  chapterCount: number
}
```

**Example:**
```typescript
const result = loadBook({
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter One',
      htmlContent: '<h1>Chapter One</h1><p>It was a dark and stormy night...</p>'
    }
  ]
})
console.log(`Loaded ${result.chapterCount} chapters`)
```

#### `unloadBook()`

Unload the current book and free resources.

```typescript
function unloadBook(): void
```

---

### Pagination

#### `paginateBook(width, height)`

Calculate page breaks for the loaded book.

```typescript
function paginateBook(width: number, height: number): WasmPaginationResult
```

**Parameters:**
- `width` - Container width in pixels
- `height` - Container height in pixels

**Returns:**
```typescript
interface WasmPaginationResult {
  totalPages: number
  pageChapterMap: Array<{
    pageIndex: number
    chapterId: string
    chapterTitle: string
  }>
}
```

**Example:**
```typescript
// Get canvas dimensions
const width = canvas.clientWidth * window.devicePixelRatio
const height = canvas.clientHeight * window.devicePixelRatio

const result = paginateBook(width, height)
console.log(`Book has ${result.totalPages} pages`)
```

#### `updateSettings(settings)`

Update reader settings and trigger re-pagination.

```typescript
function updateSettings(settings: WasmReaderSettings): WasmSettingsUpdateResult
```

**Returns:**
```typescript
interface WasmSettingsUpdateResult {
  totalPages: number
  repaginated: boolean
}
```

#### `getPageChapter(pageIndex)`

Get chapter information for a specific page.

```typescript
function getPageChapter(pageIndex: number): WasmPageChapter
```

**Returns:**
```typescript
interface WasmPageChapter {
  chapterId: string
  chapterTitle: string
}
```

---

### Rendering

#### `renderPage(pageIndex, width, height)`

Render a page to a pixel buffer.

```typescript
function renderPage(
  pageIndex: number,
  width: number,
  height: number
): Uint8ClampedArray
```

**Parameters:**
- `pageIndex` - Zero-based page index
- `width` - Render width in pixels
- `height` - Render height in pixels

**Returns:**
- RGBA pixel buffer (4 bytes per pixel)

**Example:**
```typescript
const pixels = renderPage(currentPage, width, height)

// Create ImageData and draw to canvas
const imageData = new ImageData(pixels, width, height)
ctx.putImageData(imageData, 0, 0)
```

#### `getCurrentSettings()`

Get current reader settings from WASM.

```typescript
function getCurrentSettings(): WasmReaderSettings | null
```

---

### Search

#### `searchText(query)`

Search for text in the loaded book.

```typescript
function searchText(query: string): WasmSearchResult[]
```

**Returns:**
```typescript
interface WasmSearchResult {
  pageIndex: number
  chapterId: string
  chapterTitle: string
  snippet: string      // Text snippet with context
  matchStart: number   // Position in page text
  matchEnd: number
}
```

**Example:**
```typescript
const results = searchText('adventure')
for (const result of results) {
  console.log(`Page ${result.pageIndex + 1}: ...${result.snippet}...`)
}
```

---

### Text Selection

The selection API enables text selection on rendered pages.

#### `selectionStart(x, y)`

Begin text selection at a position.

```typescript
function selectionStart(x: number, y: number): void
```

#### `selectionUpdate(x, y)`

Update selection during mouse drag.

```typescript
function selectionUpdate(x: number, y: number): void
```

#### `selectionEnd()`

Complete selection and get the selected text.

```typescript
function selectionEnd(): WasmSelectionResult | null
```

**Returns:**
```typescript
interface WasmSelectionResult {
  startIndex: number
  endIndex: number
  text: string
  chapterId: string
}
```

#### `selectionClear()`

Clear the current selection.

```typescript
function selectionClear(): void
```

#### `getSelectionRects()`

Get rectangles for selection highlighting.

```typescript
function getSelectionRects(): WasmSelectionRect[]
```

**Returns:**
```typescript
interface WasmSelectionRect {
  x: number
  y: number
  width: number
  height: number
}
```

#### `getSelectedText()`

Get currently selected text.

```typescript
function getSelectedText(): string | null
```

#### `getLinkAtPosition(pageIndex, x, y)`

Check if there's a clickable link at a position.

```typescript
function getLinkAtPosition(
  pageIndex: number,
  x: number,
  y: number
): string | null
```

---

### Performance

#### `prerenderPages(currentPage, width, height, range?)`

Pre-render nearby pages for smoother navigation.

```typescript
function prerenderPages(
  currentPage: number,
  width: number,
  height: number,
  range?: number  // Default: 2
): void
```

**Example:**
```typescript
// Pre-render 2 pages before and after current
prerenderPages(currentPage, width, height, 2)
```

#### `getPaginationStats()`

Get pagination statistics.

```typescript
function getPaginationStats(): {
  hasDocument: boolean
  isPaginated: boolean
  totalChapters: number
  totalPages: number
} | null
```

#### `clearRenderCache()`

Clear the rendered page cache.

```typescript
function clearRenderCache(): void
```

---

## Data Types

### WasmReaderSettings

Complete settings for the reader.

```typescript
interface WasmReaderSettings {
  // Typography
  fontFamily: string       // Font family name (must be loaded)
  fontSize: number         // Size in pixels
  lineHeight: number       // Multiplier (1.0 - 2.5)
  letterSpacing: number    // Pixels

  // Layout
  paddingX: number         // Horizontal padding in pixels
  paddingY: number         // Vertical padding in pixels
  textAlign: 'left' | 'right' | 'center' | 'justify'
  paragraphIndent: number  // First-line indent in pixels
  paragraphSpacing: number // Space between paragraphs in pixels
  maxContentWidth: number  // Max width (0 = no limit)
  
  // Column layout
  columns: number          // 1 or 2
  columnGap: number        // Gap between columns in pixels

  // Theme colors
  backgroundColor: WasmColor
  textColor: WasmColor
  linkColor: WasmColor
  headingColor: WasmColor

  // Advanced
  hyphenation: boolean
}

interface WasmColor {
  r: number  // 0-255
  g: number  // 0-255
  b: number  // 0-255
  a: number  // 0-255 (alpha)
}
```

### Theme Presets

Pre-defined color themes are available:

```typescript
import { WASM_THEME_COLORS } from '../types/wasm-reader.types'

// Available themes: 'warm', 'cool', 'sepia', 'white', 'night'
const warmTheme = WASM_THEME_COLORS.warm
```

### Converting Settings

Use the helper function to convert from app settings:

```typescript
import { convertSettingsToWasm } from '../services/WasmReaderService'

const wasmSettings = convertSettingsToWasm(appSettings, 'warm')
updateSettings(wasmSettings)
```

---

## Error Handling

The WASM module throws `JsError` for various conditions:

| Error | Description |
|-------|-------------|
| `Reader not initialized` | Call `initWasmReader()` first |
| `No book is currently loaded` | Call `loadBook()` first |
| `Book has not been paginated yet` | Call `paginateBook()` first |
| `Page X not found` | Invalid page index |
| `Font error: ...` | Font loading failed |
| `Failed to parse book content: ...` | Invalid book JSON |

**Example Error Handling:**
```typescript
try {
  const pixels = renderPage(pageIndex, width, height)
  // ... use pixels
} catch (error) {
  if (error.message.includes('not paginated')) {
    await paginateBook(width, height)
    return renderPage(pageIndex, width, height)
  }
  throw error
}
```

---

## Usage Examples

### Complete Initialization Flow

```typescript
import {
  initWasmReader,
  loadBundledFonts,
  loadBook,
  updateSettings,
  paginateBook,
  renderPage,
  convertSettingsToWasm,
} from '../services/WasmReaderService'

async function initializeReader(
  bookContent: BookContent,
  settings: ReaderSettings,
  canvas: HTMLCanvasElement
) {
  // 1. Initialize WASM
  await initWasmReader()
  
  // 2. Load fonts
  await loadBundledFonts()
  
  // 3. Load book
  const loadResult = loadBook(bookContent)
  console.log(`Loaded ${loadResult.chapterCount} chapters`)
  
  // 4. Apply settings
  const wasmSettings = convertSettingsToWasm(settings, 'warm')
  updateSettings(wasmSettings)
  
  // 5. Paginate
  const dpr = window.devicePixelRatio
  const width = canvas.clientWidth * dpr
  const height = canvas.clientHeight * dpr
  
  const pagination = paginateBook(width, height)
  console.log(`Book has ${pagination.totalPages} pages`)
  
  return pagination
}
```

### Rendering a Page

```typescript
function displayPage(
  canvas: HTMLCanvasElement,
  pageIndex: number
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const dpr = window.devicePixelRatio
  const width = canvas.clientWidth * dpr
  const height = canvas.clientHeight * dpr
  
  // Set canvas size for HiDPI
  canvas.width = width
  canvas.height = height
  
  // Get pixel buffer from WASM
  const pixels = renderPage(pageIndex, width, height)
  
  // Draw to canvas
  const imageData = new ImageData(pixels, width, height)
  ctx.putImageData(imageData, 0, 0)
}
```

### Handling Resize

```typescript
function handleResize(canvas: HTMLCanvasElement, currentPage: number) {
  const dpr = window.devicePixelRatio
  const width = canvas.clientWidth * dpr
  const height = canvas.clientHeight * dpr
  
  // Clear cache since dimensions changed
  clearRenderCache()
  
  // Re-paginate
  const pagination = paginateBook(width, height)
  
  // Adjust page if it no longer exists
  const newPage = Math.min(currentPage, pagination.totalPages - 1)
  
  // Re-render
  displayPage(canvas, newPage)
  
  return { pagination, newPage }
}
```

### Text Selection

```typescript
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * window.devicePixelRatio
  const y = (e.clientY - rect.top) * window.devicePixelRatio
  selectionStart(x, y)
})

canvas.addEventListener('mousemove', (e) => {
  if (e.buttons !== 1) return
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * window.devicePixelRatio
  const y = (e.clientY - rect.top) * window.devicePixelRatio
  selectionUpdate(x, y)
  
  // Draw selection highlights
  const rects = getSelectionRects()
  // ... draw rects as semi-transparent overlay
})

canvas.addEventListener('mouseup', () => {
  const selection = selectionEnd()
  if (selection && selection.text) {
    console.log('Selected:', selection.text)
    // Copy to clipboard, show context menu, etc.
  }
})
```

---

## See Also

- [WASM Reader Architecture](./WASM-READER-ARCHITECTURE.md) - Design decisions and internal architecture
- [WASM Reader Development](./WASM-READER-DEVELOPMENT.md) - Build and development guide
- [WASM Reader Setup](./WASM-READER-SETUP.md) - Initial setup instructions

