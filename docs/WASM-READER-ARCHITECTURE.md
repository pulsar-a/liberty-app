# WASM Reader Architecture & Implementation Spec

This document captures the architectural decisions and implementation details for replacing the browser-based e-book reader with a Rust/WebAssembly canvas-based renderer.

---

## Problem Statement

### Current Issues with Browser-Based Rendering

The existing Liberty reader uses HTML/CSS rendering with DOM-based measurement for pagination. This approach has fundamental problems:

1. **Unpredictable text layout** - Browser CSS layout is a black box; we can't predict exactly where lines will break
2. **Measurement inconsistency** - `scrollHeight` measurements don't always match actual rendered height
3. **Cross-platform variance** - Font rendering differs across Windows/Mac/Linux
4. **Safety margins required** - Current code uses 5% safety margins and still gets overflow
5. **Non-deterministic pagination** - Same book with same settings can produce different page counts

### Current Implementation Files (for reference)

- `src/renderer/src/services/ContentFitter.ts` - Client-side DOM-based pagination
- `src/renderer/src/components/reader/MeasurementContainer.tsx` - Hidden DOM for measurement
- `src/main/services/pagination.ts` - Server-side character-count estimation
- `src/renderer/src/components/reader/PageRenderer.tsx` - Current page display

---

## Chosen Solution: WASM + Canvas Rendering

### Why This Approach

| Aspect | Browser (Current) | WASM Canvas (New) |
|--------|-------------------|-------------------|
| Line break position | Browser decides | We decide |
| Text height | Measure after render | Known before render |
| Cross-platform | Varies by OS/browser | Identical everywhere |
| Font substitution | Browser may substitute | We control font loading |
| Pagination determinism | No guarantee | **Guaranteed** |

### Architecture Overview

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

---

## Data Flow

### Book Loading Flow

```
1. User opens book (existing flow)
       │
       ▼
2. EPUB parsed to BookContent (existing EpubParser)
       │
       ▼
3. BookContent sent to WASM module
       │
       ▼
4. WASM: Parse HTML chapters → LayoutDocument
       │
       ▼
5. WASM: Paginate with current settings → Vec<Page>
       │
       ▼
6. WASM: Return page count to React
       │
       ▼
7. React: Display page controls, request page render
       │
       ▼
8. WASM: Render requested page → pixel buffer
       │
       ▼
9. React: Draw buffer to canvas
```

### Settings Change Flow

```
1. User changes font size/theme/etc in React UI
       │
       ▼
2. React calls wasmReader.updateSettings(newSettings)
       │
       ▼
3. WASM: Re-paginate book with new settings
       │
       ▼
4. WASM: Return new page count, adjusted current page
       │
       ▼
5. React: Update UI, request current page render
       │
       ▼
6. WASM: Render page with new settings → pixel buffer
       │
       ▼
7. React: Draw to canvas
```

---

## Core Data Types

### Rust Types

```rust
// Settings passed from React
#[derive(Serialize, Deserialize, Clone)]
pub struct ReaderSettings {
    // Typography
    pub font_family: String,
    pub font_size: f32,           // pixels
    pub line_height: f32,         // multiplier (1.0 - 2.5)
    pub letter_spacing: f32,      // pixels
    
    // Layout
    pub padding_x: f32,           // pixels
    pub padding_y: f32,           // pixels
    pub text_align: TextAlign,    // Left, Right, Center, Justify
    pub paragraph_indent: f32,    // pixels
    pub paragraph_spacing: f32,   // pixels
    pub max_content_width: f32,   // pixels (0 = no limit)
    
    // Theme
    pub background_color: Color,
    pub text_color: Color,
    pub link_color: Color,
    pub heading_color: Color,
    
    // Advanced
    pub hyphenation: bool,
}

#[derive(Serialize, Deserialize, Clone, Copy)]
pub enum TextAlign {
    Left,
    Right,
    Center,
    Justify,
}

#[derive(Serialize, Deserialize, Clone, Copy)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

// Internal layout model (not exposed to JS)
pub struct LayoutDocument {
    pub chapters: Vec<LayoutChapter>,
}

pub struct LayoutChapter {
    pub id: String,
    pub title: String,
    pub elements: Vec<LayoutElement>,
}

pub enum LayoutElement {
    Paragraph {
        spans: Vec<TextSpan>,
        indent: bool,
    },
    Heading {
        level: u8,
        spans: Vec<TextSpan>,
    },
    Image {
        src: String,
        width: u32,
        height: u32,
        data: Vec<u8>,
    },
    BlockQuote {
        elements: Vec<LayoutElement>,
    },
    List {
        ordered: bool,
        items: Vec<Vec<LayoutElement>>,
    },
    HorizontalRule,
}

pub struct TextSpan {
    pub text: String,
    pub style: SpanStyle,
}

pub struct SpanStyle {
    pub bold: bool,
    pub italic: bool,
    pub link: Option<String>,
    pub font_size_override: Option<f32>,
}

// Paginated output
pub struct PaginatedBook {
    pub pages: Vec<Page>,
    pub total_pages: usize,
}

pub struct Page {
    pub index: usize,
    pub chapter_id: String,
    pub chapter_title: String,
    pub elements: Vec<PageElement>,
}

pub struct PageElement {
    pub layout_element: LayoutElement,
    pub y_position: f32,
    pub height: f32,
}
```

### TypeScript Types (matching Rust via wasm-bindgen)

```typescript
// src/renderer/src/types/wasm-reader.types.ts

export interface WasmReaderSettings {
  // Typography
  fontFamily: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
  
  // Layout
  paddingX: number
  paddingY: number
  textAlign: 'left' | 'right' | 'center' | 'justify'
  paragraphIndent: number
  paragraphSpacing: number
  maxContentWidth: number
  
  // Theme
  backgroundColor: WasmColor
  textColor: WasmColor
  linkColor: WasmColor
  headingColor: WasmColor
  
  // Advanced
  hyphenation: boolean
}

export interface WasmColor {
  r: number
  g: number
  b: number
  a: number
}

export interface WasmPaginationResult {
  totalPages: number
  currentPage: number  // adjusted if previous page no longer exists
}

export interface WasmRenderResult {
  pixels: Uint8ClampedArray
  width: number
  height: number
}
```

---

## WASM API Surface

### Exported Functions

```rust
// lib.rs - Public API exposed to JavaScript

use wasm_bindgen::prelude::*;

/// Initialize the reader with book content
/// Called once when opening a book
#[wasm_bindgen]
pub fn load_book(book_content_json: &str) -> Result<JsValue, JsError> {
    // Parse BookContent from JSON
    // Convert to internal LayoutDocument
    // Return book metadata
}

/// Set/update reader settings
/// Triggers re-pagination
#[wasm_bindgen]
pub fn update_settings(settings_json: &str) -> Result<JsValue, JsError> {
    // Parse settings
    // Store in global state
    // Re-paginate if book is loaded
    // Return new pagination info
}

/// Paginate the book with current settings and container dimensions
#[wasm_bindgen]
pub fn paginate(width: u32, height: u32) -> Result<JsValue, JsError> {
    // Calculate page breaks based on:
    // - Container dimensions
    // - Current settings (font size, line height, padding)
    // Return: { totalPages, pageChapterMap }
}

/// Render a specific page to pixel buffer
#[wasm_bindgen]
pub fn render_page(page_index: u32, width: u32, height: u32) -> Result<Vec<u8>, JsError> {
    // Render the specified page
    // Return RGBA pixel buffer
}

/// Get chapter info for a page (for TOC highlighting)
#[wasm_bindgen]
pub fn get_page_chapter(page_index: u32) -> Result<JsValue, JsError> {
    // Return { chapterId, chapterTitle }
}

/// Search for text in book
#[wasm_bindgen]
pub fn search_text(query: &str) -> Result<JsValue, JsError> {
    // Return array of { pageIndex, snippet, position }
}

/// Load a font file for use in rendering
#[wasm_bindgen]
pub fn load_font(font_name: &str, font_data: &[u8]) -> Result<(), JsError> {
    // Register font with internal font system
}

/// Clean up resources when closing book
#[wasm_bindgen]
pub fn unload_book() {
    // Free memory, clear caches
}
```

---

## React Integration

### New Component: WasmPageRenderer

```typescript
// src/renderer/src/components/reader/WasmPageRenderer.tsx

import React, { useRef, useEffect, useCallback } from 'react'
import { initWasmReader, renderPage } from '../../services/WasmReaderService'
import { useReaderStore } from '../../store/useReaderStore'
import { useReaderSettingsStore } from '../../store/useReaderSettingsStore'

export const WasmPageRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { currentPageIndex, totalPages } = useReaderStore()
  const { settings } = useReaderSettingsStore()
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  // Initialize WASM module
  useEffect(() => {
    initWasmReader()
  }, [])
  
  // Track container size
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDimensions({ 
        width: Math.floor(width * window.devicePixelRatio),
        height: Math.floor(height * window.devicePixelRatio)
      })
    })
    
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  // Render current page when it changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Get pixel buffer from WASM
    const pixels = renderPage(currentPageIndex, dimensions.width, dimensions.height)
    
    // Create ImageData and draw to canvas
    const imageData = new ImageData(
      new Uint8ClampedArray(pixels),
      dimensions.width,
      dimensions.height
    )
    ctx.putImageData(imageData, 0, 0)
    
  }, [currentPageIndex, dimensions, settings])
  
  return (
    <div ref={containerRef} className="wasm-reader-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}
```

### WASM Service Layer

```typescript
// src/renderer/src/services/WasmReaderService.ts

import init, {
  load_book,
  update_settings,
  paginate,
  render_page,
  load_font,
  unload_book,
} from '../wasm-reader/pkg/liberty_reader'

let initialized = false
let bookLoaded = false

export async function initWasmReader(): Promise<void> {
  if (initialized) return
  
  await init()
  initialized = true
  
  // Load bundled fonts
  await loadBundledFonts()
}

async function loadBundledFonts(): Promise<void> {
  const fonts = [
    { name: 'Literata', url: '/fonts/Literata-Regular.ttf' },
    { name: 'Literata-Bold', url: '/fonts/Literata-Bold.ttf' },
    { name: 'Literata-Italic', url: '/fonts/Literata-Italic.ttf' },
    // ... other fonts
  ]
  
  for (const font of fonts) {
    const response = await fetch(font.url)
    const data = await response.arrayBuffer()
    load_font(font.name, new Uint8Array(data))
  }
}

export async function loadBook(bookContent: BookContent): Promise<PaginationResult> {
  if (!initialized) await initWasmReader()
  
  const result = load_book(JSON.stringify(bookContent))
  bookLoaded = true
  
  return result
}

export function updateSettings(settings: WasmReaderSettings): PaginationResult {
  return JSON.parse(update_settings(JSON.stringify(settings)))
}

export function paginateBook(width: number, height: number): PaginationResult {
  return JSON.parse(paginate(width, height))
}

export function renderPage(
  pageIndex: number, 
  width: number, 
  height: number
): Uint8ClampedArray {
  const pixels = render_page(pageIndex, width, height)
  return new Uint8ClampedArray(pixels)
}

export function closeBook(): void {
  if (bookLoaded) {
    unload_book()
    bookLoaded = false
  }
}
```

---

## File Structure

```
src/
  renderer/
    src/
      wasm-reader/                    # Rust crate
        Cargo.toml
        src/
          lib.rs                      # WASM entry point, public API
          layout/
            mod.rs
            document.rs               # LayoutDocument, LayoutElement types
            html_parser.rs            # HTML → LayoutDocument conversion
          pagination/
            mod.rs
            paginator.rs              # Main pagination algorithm
            line_breaker.rs           # Text line breaking
          render/
            mod.rs
            canvas.rs                 # Pixel buffer rendering
            text.rs                   # Glyph rendering
            images.rs                 # Image rendering
          fonts/
            mod.rs
            loader.rs                 # Font loading and caching
            metrics.rs                # Font measurement
          settings.rs                 # ReaderSettings type
          error.rs                    # Error types
        pkg/                          # Generated (gitignored)
      
      components/
        reader/
          WasmPageRenderer.tsx        # New canvas-based renderer
          PageRenderer.tsx            # Keep as fallback
          
      services/
        WasmReaderService.ts          # TypeScript wrapper for WASM
        ContentFitter.ts              # Keep as fallback
        
      types/
        wasm-reader.types.ts          # TypeScript types for WASM API
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Rust project structure
- [ ] Implement font loading with `cosmic-text`
- [ ] Basic text measurement and line breaking
- [ ] Simple paragraph rendering to pixel buffer
- [ ] Canvas integration in React

### Phase 2: Core Features (Week 3-4)
- [ ] HTML parsing for EPUB content
- [ ] Full LayoutElement support (headings, lists, blockquotes)
- [ ] Image rendering
- [ ] Pagination algorithm
- [ ] Settings integration

### Phase 3: Polish (Week 5-6)
- [ ] Text selection support
- [ ] Link handling (internal and external)
- [ ] Search functionality
- [ ] Performance optimization
- [ ] Memory management for large books

### Phase 4: Integration (Week 7-8)
- [ ] Replace existing reader in production
- [ ] Migration path for stored reading positions
- [ ] Fallback mechanism for edge cases
- [ ] Testing across platforms

---

## Settings Mapping

Current CSS-based settings → WASM equivalents:

| Current (CSS) | WASM Parameter | Notes |
|---------------|----------------|-------|
| `--page-font-family` | `font_family: String` | Font name, must be pre-loaded |
| `--page-font-size` | `font_size: f32` | Pixels, not rem |
| `--page-line-height` | `line_height: f32` | Multiplier (e.g., 1.5) |
| `--page-padding-x` | `padding_x: f32` | Pixels |
| `--page-padding-y` | `padding_y: f32` | Pixels |
| `--page-max-width` | `max_content_width: f32` | Pixels, 0 = no limit |
| `--page-text-align` | `text_align: TextAlign` | Enum value |
| `--page-hyphens` | `hyphenation: bool` | Enable/disable |
| `--page-paragraph-spacing` | `paragraph_spacing: f32` | Pixels |
| `--page-paragraph-indent` | `paragraph_indent: f32` | Pixels |
| Theme CSS variables | `*_color: Color` | Direct RGBA values |

---

## Performance Considerations

### Memory
- Large books: Stream chapters, don't load all at once
- Images: Decode on-demand, cache rendered pages
- Fonts: Load only needed weights/styles

### Rendering
- Cache rendered pages (LRU cache of pixel buffers)
- Render adjacent pages in background
- Use `requestAnimationFrame` for smooth page turns

### Pagination
- Paginate in chunks (progress callback)
- Cache pagination results per settings hash
- Invalidate only affected pages on partial settings change

---

## Migration Strategy

1. **Feature flag**: Add setting to switch between HTML and WASM renderer
2. **Parallel testing**: Run both renderers, compare page counts
3. **Gradual rollout**: Default to WASM for new books
4. **Full migration**: Remove HTML renderer after validation

---

## Open Questions

1. **Text selection**: Canvas doesn't have native selection. Implement custom selection with mouse tracking?
2. **Copy/paste**: Need to track text positions for copying selected text
3. **Accessibility**: Screen reader support? May need hidden DOM mirror
4. **RTL languages**: cosmic-text supports RTL, but needs testing
5. **Complex tables**: How to handle large tables that span multiple pages?

---

## References

- [cosmic-text](https://github.com/pop-os/cosmic-text) - Pure Rust text shaping and layout
- [fontdue](https://github.com/mooman219/fontdue) - Font rasterization
- [wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/) - Rust/JS interop
- [scraper](https://github.com/causal-agent/scraper) - HTML parsing in Rust

