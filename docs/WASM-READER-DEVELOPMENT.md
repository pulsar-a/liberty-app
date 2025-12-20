# Liberty Reader - WASM Reader Development Guide

This guide covers building, developing, and extending the Liberty Reader WASM module.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Building](#building)
- [Development Workflow](#development-workflow)
- [Rust Module Structure](#rust-module-structure)
- [Adding New Features](#adding-new-features)
- [Testing](#testing)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
src/renderer/src/wasm-reader/
├── Cargo.toml              # Rust project configuration
├── Cargo.lock              # Dependency lock file
├── .cargo/
│   └── config.toml         # Cargo configuration for WASM target
├── src/
│   ├── lib.rs              # WASM entry point, public API
│   ├── error.rs            # Error types
│   ├── settings.rs         # ReaderSettings type
│   ├── selection.rs        # Text selection state
│   ├── fonts/
│   │   ├── mod.rs          # Module exports
│   │   ├── loader.rs       # Font loading and management
│   │   └── metrics.rs      # Font measurement utilities
│   ├── layout/
│   │   ├── mod.rs          # Module exports
│   │   ├── document.rs     # LayoutDocument, LayoutElement types
│   │   └── html_parser.rs  # HTML → LayoutDocument conversion
│   ├── pagination/
│   │   ├── mod.rs          # Module exports
│   │   └── paginator.rs    # Main pagination algorithm
│   └── render/
│       ├── mod.rs          # Module exports
│       ├── canvas.rs       # Main renderer, pixel buffer
│       └── text.rs         # Glyph rendering
├── pkg/                    # Generated WASM output (gitignored)
└── target/                 # Build artifacts (gitignored)
```

---

## Prerequisites

### Install Rust

```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown
```

### Install wasm-pack

```bash
# Using cargo
cargo install wasm-pack

# Or using npm
npm install -g wasm-pack
```

### Verify Installation

```bash
rustc --version          # Should show 1.70+
wasm-pack --version      # Should show 0.12+
```

---

## Building

### Development Build

```bash
cd src/renderer/src/wasm-reader

# Build with debug symbols
wasm-pack build --target web --dev

# Output in pkg/
```

### Production Build

```bash
cd src/renderer/src/wasm-reader

# Optimized build
wasm-pack build --target web --release

# Output in pkg/
```

### Build Options

| Flag | Description |
|------|-------------|
| `--target web` | For ES modules (recommended) |
| `--target bundler` | For webpack/Vite bundlers |
| `--dev` | Debug build with symbols |
| `--release` | Optimized production build |
| `--profiling` | Release with debug info |

### Using Task Runner

If using `Taskfile.yml`:

```bash
# Build WASM module
task wasm:build

# Build and watch for changes
task wasm:watch
```

---

## Development Workflow

### 1. Make Changes to Rust Code

Edit files in `src/renderer/src/wasm-reader/src/`.

### 2. Build WASM

```bash
cd src/renderer/src/wasm-reader
wasm-pack build --target web --dev
```

### 3. Test in Browser

The Electron/Vite dev server will automatically pick up the new `pkg/` output.

```bash
# From project root
npm run dev
```

### 4. Check Console

Enable console logging in Rust:

```rust
use web_sys::console;

console::log_1(&"Debug message".into());
console::log_2(&"Value:".into(), &JsValue::from(42));
```

### Watch Mode (Auto-rebuild)

```bash
# Install cargo-watch
cargo install cargo-watch

# Watch and rebuild on changes
cd src/renderer/src/wasm-reader
cargo watch -s "wasm-pack build --target web --dev"
```

---

## Rust Module Structure

### lib.rs - Public API

The entry point exports all functions to JavaScript via `#[wasm_bindgen]`:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init() -> Result<(), JsError> {
    // Initialize module
}

#[wasm_bindgen]
pub fn load_book(json: &str) -> Result<JsValue, JsError> {
    // Load and parse book content
}
```

### Global State

The reader uses thread-local state for the current book and settings:

```rust
thread_local! {
    static READER_STATE: RefCell<Option<ReaderState>> = RefCell::new(None);
}

struct ReaderState {
    settings: ReaderSettings,
    font_manager: FontManager,
    document: Option<LayoutDocument>,
    paginated: Option<PaginatedBook>,
    renderer: Renderer,
    selection: SelectionState,
}
```

### Error Handling

Errors are defined in `error.rs` using `thiserror`:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ReaderError {
    #[error("No book is currently loaded")]
    NoBookLoaded,
    
    #[error("Page {0} not found")]
    PageNotFound(u32),
    
    // ... more errors
}
```

### Settings

Reader settings are in `settings.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReaderSettings {
    pub font_family: String,
    pub font_size: f32,
    pub line_height: f32,
    // ... more fields
}
```

Note: Uses `#[serde(rename_all = "camelCase")]` for JavaScript compatibility.

---

## Adding New Features

### Adding a New API Function

1. **Add the function to `lib.rs`:**

```rust
/// Get the table of contents
#[wasm_bindgen]
pub fn get_toc() -> Result<JsValue, JsError> {
    with_state(|state| {
        let document = state.document.as_ref()
            .ok_or(ReaderError::NoBookLoaded)?;
        
        let toc: Vec<_> = document.chapters.iter()
            .map(|c| serde_json::json!({
                "id": c.id,
                "title": c.title,
            }))
            .collect();
        
        Ok(serde_wasm_bindgen::to_value(&toc)?)
    })
}
```

2. **Add TypeScript types in `wasm-reader.types.ts`:**

```typescript
export interface TocEntry {
  id: string
  title: string
}
```

3. **Add wrapper in `WasmReaderService.ts`:**

```typescript
export function getTableOfContents(): TocEntry[] {
  if (!wasmModule) {
    throw new Error('WASM module not initialized')
  }
  return wasmModule.get_toc()
}
```

4. **Rebuild:**

```bash
wasm-pack build --target web --dev
```

### Adding a New Layout Element

1. **Add variant to `LayoutElement` enum in `layout/document.rs`:**

```rust
pub enum LayoutElement {
    // ... existing variants
    
    /// A custom callout box
    Callout {
        kind: CalloutKind,
        content: Vec<LayoutElement>,
    },
}

pub enum CalloutKind {
    Note,
    Warning,
    Tip,
}
```

2. **Handle in HTML parser (`layout/html_parser.rs`):**

```rust
"aside" => {
    let kind = element.value().attr("class")
        .map(|c| match c {
            "warning" => CalloutKind::Warning,
            "tip" => CalloutKind::Tip,
            _ => CalloutKind::Note,
        })
        .unwrap_or(CalloutKind::Note);
    
    let content = parse_children(element, inherited_style);
    Some(LayoutElement::Callout { kind, content })
}
```

3. **Handle in paginator (`pagination/paginator.rs`):**

```rust
LayoutElement::Callout { content, .. } => {
    let mut height = self.settings.font_size; // Padding
    for el in content {
        height += self.measure_element(el);
    }
    height
}
```

4. **Handle in renderer (`render/canvas.rs`):**

```rust
LayoutElement::Callout { kind, content } => {
    // Draw callout background
    let bg_color = match kind {
        CalloutKind::Warning => Color::rgb(255, 243, 205),
        CalloutKind::Tip => Color::rgb(209, 250, 229),
        CalloutKind::Note => Color::rgb(219, 234, 254),
    };
    
    // ... render background and content
}
```

### Adding New Settings

1. **Add field to `ReaderSettings` in `settings.rs`:**

```rust
pub struct ReaderSettings {
    // ... existing fields
    
    /// Enable drop caps for chapter starts
    #[serde(default)]
    pub drop_caps: bool,
}
```

2. **Add to TypeScript types:**

```typescript
interface WasmReaderSettings {
  // ... existing fields
  dropCaps: boolean
}
```

3. **Use in renderer/paginator as needed.**

---

## Testing

### Unit Tests (Rust)

```bash
cd src/renderer/src/wasm-reader

# Run unit tests
cargo test

# Run with output
cargo test -- --nocapture
```

### Browser Tests

```bash
# Run WASM tests in browser
wasm-pack test --headless --chrome
```

### Test File Structure

Add tests in the same file or in a `tests/` directory:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_paragraph() {
        let elements = parse_html_to_elements("<p>Hello</p>");
        assert_eq!(elements.len(), 1);
    }
}
```

### Integration Tests

Create `tests/integration.rs`:

```rust
use liberty_reader::*;

#[test]
fn test_full_flow() {
    init().unwrap();
    
    // Load a test book
    let book_json = r#"{"chapters": [{"id": "1", "title": "Ch1", "htmlContent": "<p>Test</p>"}]}"#;
    load_book(book_json).unwrap();
    
    // Paginate
    let result = paginate(800, 600).unwrap();
    assert!(result.totalPages > 0);
}
```

---

## Performance Optimization

### Profiling

Enable profiling build:

```bash
wasm-pack build --target web --profiling
```

Use browser DevTools Performance tab to analyze.

### Memory Tips

1. **Avoid large allocations in hot paths:**
   ```rust
   // Bad: allocates every time
   for _ in 0..1000 {
       let v = vec![0u8; 1024];
   }
   
   // Good: reuse allocation
   let mut v = vec![0u8; 1024];
   for _ in 0..1000 {
       v.clear();
       // use v
   }
   ```

2. **Use `String::with_capacity` for known sizes:**
   ```rust
   let mut s = String::with_capacity(text.len());
   ```

3. **Cache expensive computations:**
   ```rust
   struct Renderer {
       page_cache: HashMap<usize, CachedPage>,
   }
   ```

### Rendering Optimization

1. **Page caching** is already implemented (5-page LRU cache)

2. **Pre-rendering adjacent pages:**
   ```typescript
   prerenderPages(currentPage, width, height, 2)
   ```

3. **Clear cache on settings change** to avoid stale renders

### WASM Size Optimization

In `Cargo.toml`:

```toml
[profile.release]
opt-level = "s"     # Optimize for size
lto = true          # Link-time optimization
codegen-units = 1   # Single codegen unit for better optimization
```

---

## Troubleshooting

### Common Errors

#### "wasm-bindgen not found"

Make sure wasm-pack is installed:
```bash
cargo install wasm-pack
```

#### "cannot find type X in this scope"

Check module imports:
```rust
use crate::layout::LayoutElement;  // Not super::
```

#### "the trait Serialize is not implemented"

Add serde derive:
```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct MyType { ... }
```

#### WASM module fails to load

1. Check browser console for errors
2. Verify `pkg/` contains generated files
3. Check import path in TypeScript

#### Fonts not rendering

1. Verify fonts are loaded before rendering:
   ```typescript
   await loadBundledFonts()
   ```
2. Check font family names match:
   ```typescript
   settings.fontFamily = 'Literata'  // Must match loaded font name
   ```

### Debugging Tips

1. **Add console logging:**
   ```rust
   use web_sys::console;
   console::log_1(&format!("Value: {:?}", value).into());
   ```

2. **Enable panic hook (enabled by default):**
   ```rust
   #[cfg(feature = "console_error_panic_hook")]
   console_error_panic_hook::set_once();
   ```

3. **Check WASM binary size:**
   ```bash
   ls -lh pkg/liberty_reader_bg.wasm
   ```

4. **Inspect generated JS bindings:**
   ```bash
   cat pkg/liberty_reader.js
   ```

---

## Dependencies

The WASM module uses these key crates:

| Crate | Purpose |
|-------|---------|
| `wasm-bindgen` | Rust/JS interop |
| `cosmic-text` | Text shaping and layout |
| `fontdue` | Font rasterization |
| `scraper` | HTML parsing |
| `image` | Image decoding |
| `hyphenation` | Text hyphenation |
| `serde` | Serialization |

### Updating Dependencies

```bash
cargo update
wasm-pack build --target web --release
```

---

## See Also

- [WASM Reader API Reference](./WASM-READER-API.md) - Complete API documentation
- [WASM Reader Architecture](./WASM-READER-ARCHITECTURE.md) - Design decisions
- [wasm-bindgen Guide](https://rustwasm.github.io/wasm-bindgen/) - Official documentation
- [Rust WASM Book](https://rustwasm.github.io/docs/book/) - Comprehensive guide

