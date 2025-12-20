# Liberty Reader - WASM Engine

A Rust/WebAssembly-based e-book rendering engine for the Liberty e-reader application. This module provides deterministic text layout and canvas-based rendering for consistent cross-platform reading experiences.

## Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
cargo install wasm-pack
```

### Building

```bash
# Development build
wasm-pack build --target web --dev

# Production build
wasm-pack build --target web --release
```

Output will be in the `pkg/` directory.

### Using in TypeScript

```typescript
import {
  initWasmReader,
  loadBundledFonts,
  loadBook,
  paginateBook,
  renderPage,
} from '../services/WasmReaderService'

// Initialize
await initWasmReader()
await loadBundledFonts()

// Load book
loadBook(bookContent)

// Paginate
const { totalPages } = paginateBook(width, height)

// Render
const pixels = renderPage(0, width, height)
const imageData = new ImageData(pixels, width, height)
ctx.putImageData(imageData, 0, 0)
```

## Features

- ✅ **Deterministic pagination** - Same settings always produce same page counts
- ✅ **Canvas rendering** - Direct pixel rendering for consistent display
- ✅ **Custom fonts** - Load and use any TTF/OTF font
- ✅ **Text shaping** - Full Unicode support via cosmic-text
- ✅ **Rich content** - Paragraphs, headings, lists, blockquotes, images, tables
- ✅ **Text selection** - Select and copy text from rendered pages
- ✅ **Search** - Full-text search across all pages
- ✅ **Theming** - Configurable colors, fonts, and layout
- ✅ **Two-column layout** - Support for side-by-side columns
- ✅ **Hyphenation** - Automatic word hyphenation

## Project Structure

```
src/
├── lib.rs              # WASM entry point, public API
├── error.rs            # Error types
├── settings.rs         # ReaderSettings configuration
├── selection.rs        # Text selection state
├── fonts/
│   ├── loader.rs       # Font loading and management
│   └── metrics.rs      # Font measurement
├── layout/
│   ├── document.rs     # LayoutDocument, LayoutElement types
│   └── html_parser.rs  # HTML → layout model conversion
├── pagination/
│   └── paginator.rs    # Page breaking algorithm
└── render/
    ├── canvas.rs       # Main renderer
    └── text.rs         # Glyph rendering
```

## API Overview

### Initialization
- `init()` - Initialize the WASM module
- `load_font(name, data)` - Load a font file

### Book Management
- `load_book(json)` - Load book content
- `unload_book()` - Unload and free resources

### Pagination
- `paginate(width, height)` - Calculate page breaks
- `update_settings(json)` - Update settings (triggers re-pagination)
- `get_page_chapter(index)` - Get chapter info for a page

### Rendering
- `render_page(index, width, height)` - Render to pixel buffer
- `prerender_pages(current, width, height, range)` - Pre-render nearby pages
- `clear_render_cache()` - Clear cached pages

### Search & Selection
- `search_text(query)` - Search for text
- `selection_start/update/end(x, y)` - Text selection
- `get_selected_text()` - Get selected text
- `get_selection_rects()` - Get highlight rectangles

## Documentation

- [API Reference](../../../docs/WASM-READER-API.md) - Complete API documentation
- [Development Guide](../../../docs/WASM-READER-DEVELOPMENT.md) - Build and development
- [Architecture](../../../docs/WASM-READER-ARCHITECTURE.md) - Design decisions
- [Setup Guide](../../../docs/WASM-READER-SETUP.md) - Initial setup

## Dependencies

| Crate | Purpose |
|-------|---------|
| wasm-bindgen | Rust/JS interop |
| cosmic-text | Text shaping and layout |
| fontdue | Font rasterization |
| scraper | HTML parsing |
| image | Image decoding (PNG, JPEG, GIF, WebP) |
| hyphenation | Automatic hyphenation |
| serde | JSON serialization |

## Testing

```bash
# Run Rust unit tests
cargo test

# Run WASM tests in browser
wasm-pack test --headless --chrome
```

## License

Part of the Liberty e-reader application.

