# WASM Reader Setup Guide

This guide covers everything you need to install and configure to develop a Rust/WebAssembly-based e-book reader that integrates with the existing Electron app.

## Prerequisites

### 1. Install Rust

**Windows (PowerShell as Admin):**
```powershell
# Download and run rustup installer
winget install Rustlang.Rustup

# Or manually from https://rustup.rs
```

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation, restart your terminal and verify:
```bash
rustc --version
cargo --version
```

### 2. Add WebAssembly Target

```bash
rustup target add wasm32-unknown-unknown
```

### 3. Install wasm-pack

wasm-pack is the tool that compiles Rust to WASM and generates JavaScript bindings.

**Windows:**
```powershell
cargo install wasm-pack
```

**macOS/Linux:**
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
# Or: cargo install wasm-pack
```

Verify installation:
```bash
wasm-pack --version
```

### 4. Install wasm-bindgen-cli (Optional but Recommended)

```bash
cargo install wasm-bindgen-cli
```

### 5. Install cargo-watch (Optional - for Development)

Auto-rebuilds on file changes:
```bash
cargo install cargo-watch
```

---

## Project Structure

Create the Rust crate inside your renderer source:

```
src/
  renderer/
    src/
      wasm-reader/              # New Rust crate
        Cargo.toml
        src/
          lib.rs                # Main entry point
          layout.rs             # Text layout engine
          pagination.rs         # Page breaking logic
          render.rs             # Pixel rendering
          fonts.rs              # Font loading/management
          html_parser.rs        # EPUB HTML → layout model
          settings.rs           # Reader settings types
        pkg/                    # Generated WASM output (gitignored)
```

---

## Initial Cargo.toml

Create `src/renderer/src/wasm-reader/Cargo.toml`:

```toml
[package]
name = "liberty-reader"
version = "0.1.0"
edition = "2021"
authors = ["Your Name"]
description = "WASM-based e-book reader engine for Liberty"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
# WASM bindings
wasm-bindgen = "0.2"
js-sys = "0.3"
web-sys = { version = "0.3", features = [
    "console",
    "CanvasRenderingContext2d",
    "HtmlCanvasElement",
    "ImageData",
]}

# Text layout and rendering
cosmic-text = "0.11"
fontdue = "0.8"

# Image handling
image = { version = "0.25", default-features = false, features = ["png", "jpeg", "gif"] }

# HTML parsing (for EPUB content)
scraper = "0.19"
html5ever = "0.27"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde-wasm-bindgen = "0.6"

# Error handling
thiserror = "1.0"

# Logging
log = "0.4"
console_log = "1.0"

[dev-dependencies]
wasm-bindgen-test = "0.3"

[profile.release]
# Optimize for size
opt-level = "s"
lto = true
```

---

## Building the WASM Module

### Development Build

```bash
cd src/renderer/src/wasm-reader
wasm-pack build --target web --dev
```

### Production Build

```bash
wasm-pack build --target web --release
```

This generates files in `pkg/`:
- `liberty_reader.js` - JavaScript glue code
- `liberty_reader_bg.wasm` - Compiled WebAssembly
- `liberty_reader.d.ts` - TypeScript definitions

---

## Integrating with Vite/Electron

### 1. Configure Vite for WASM

Update `electron.vite.config.ts`:

```typescript
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  // ... existing config
  renderer: {
    plugins: [
      react(),
      wasm(),
      topLevelAwait()
    ],
    // Ensure WASM files are handled correctly
    optimizeDeps: {
      exclude: ['liberty-reader']
    }
  }
})
```

### 2. Install Vite WASM Plugins

```bash
npm install vite-plugin-wasm vite-plugin-top-level-await --save-dev
```

### 3. Import in TypeScript

```typescript
// src/renderer/src/services/WasmReader.ts
import init, { 
  render_page, 
  paginate_book,
  update_settings 
} from '../wasm-reader/pkg/liberty_reader'

let initialized = false

export async function initWasmReader() {
  if (!initialized) {
    await init()
    initialized = true
  }
}

export { render_page, paginate_book, update_settings }
```

---

## Development Workflow

### Watch Mode (Auto-rebuild)

Terminal 1 - Rust watcher:
```bash
cd src/renderer/src/wasm-reader
cargo watch -s "wasm-pack build --target web --dev"
```

Terminal 2 - Electron dev:
```bash
npm run dev
```

### Testing Rust Code

```bash
cd src/renderer/src/wasm-reader

# Run Rust unit tests
cargo test

# Run WASM tests in headless browser
wasm-pack test --headless --chrome
```

---

## Recommended VS Code Extensions

- **rust-analyzer** - Rust language support
- **Even Better TOML** - Cargo.toml syntax
- **CodeLLDB** - Rust debugging
- **Error Lens** - Inline error display

Add to `.vscode/settings.json`:
```json
{
  "rust-analyzer.cargo.target": "wasm32-unknown-unknown",
  "rust-analyzer.checkOnSave.allTargets": false
}
```

---

## Troubleshooting

### "wasm-pack not found"

Ensure Cargo bin is in PATH:
```bash
# Add to shell profile
export PATH="$HOME/.cargo/bin:$PATH"
```

### "can't find crate for std"

Make sure WASM target is installed:
```bash
rustup target add wasm32-unknown-unknown
```

### WASM file not loading in Electron

Check that the WASM file is being served correctly. You may need to configure your dev server to serve `.wasm` files with the correct MIME type (`application/wasm`).

### Memory issues with large books

WASM has a default memory limit. For large books, you may need to increase it:

```toml
# In Cargo.toml
[package.metadata.wasm-pack.profile.release]
wasm-opt = ["-O3", "--enable-bulk-memory"]
```

---

## Next Steps

1. Set up the basic project structure
2. Implement font loading and text measurement
3. Build the layout/pagination engine
4. Create the canvas rendering pipeline
5. Integrate with existing React reader components

See `WASM-READER-ARCHITECTURE.md` for detailed implementation specifications.

