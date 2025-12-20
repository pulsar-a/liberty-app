# Liberty Reader - WASM Internals Reference

This document describes the internal data structures, algorithms, and implementation details of the WASM reader module. It's intended for developers who need to understand or extend the core functionality.

---

## Table of Contents

- [State Management](#state-management)
- [Layout Model](#layout-model)
- [HTML Parsing](#html-parsing)
- [Pagination Algorithm](#pagination-algorithm)
- [Rendering Pipeline](#rendering-pipeline)
- [Font Management](#font-management)
- [Text Selection](#text-selection)
- [Caching Strategy](#caching-strategy)

---

## State Management

### Global State

The reader uses thread-local storage for global state, as WASM is single-threaded:

```rust
thread_local! {
    static READER_STATE: RefCell<Option<ReaderState>> = RefCell::new(None);
}
```

### ReaderState Structure

```rust
struct ReaderState {
    settings: ReaderSettings,          // Current reader configuration
    font_manager: FontManager,         // Loaded fonts
    document: Option<LayoutDocument>,  // Parsed book content
    paginated: Option<PaginatedBook>,  // Calculated pages
    renderer: Renderer,                // Pixel rendering engine
    selection: SelectionState,         // Text selection state
    current_page: Option<usize>,       // Current page (if tracked)
}
```

### State Access Pattern

All public API functions use a helper to safely access state:

```rust
fn with_state<F, R>(f: F) -> Result<R, JsError>
where
    F: FnOnce(&mut ReaderState) -> Result<R, ReaderError>,
{
    READER_STATE.with(|state| {
        let mut state = state.borrow_mut();
        let state = state.as_mut()
            .ok_or_else(|| JsError::new("Reader not initialized"))?;
        f(state).map_err(|e| JsError::new(&e.to_string()))
    })
}
```

---

## Layout Model

### LayoutDocument

The top-level container for parsed book content:

```rust
pub struct LayoutDocument {
    pub chapters: Vec<LayoutChapter>,
}
```

### LayoutChapter

A single chapter containing layout elements:

```rust
pub struct LayoutChapter {
    pub id: String,          // Unique chapter identifier
    pub title: String,       // Chapter title
    pub elements: Vec<LayoutElement>,
}
```

### LayoutElement

An enum representing different content types:

```rust
pub enum LayoutElement {
    /// A paragraph of text with optional first-line indent
    Paragraph {
        spans: Vec<TextSpan>,
        indent: bool,
    },
    
    /// A heading (h1-h6)
    Heading {
        level: u8,           // 1-6
        spans: Vec<TextSpan>,
    },
    
    /// An image
    Image {
        src: String,
        alt: String,
        data: Option<Vec<u8>>,  // Decoded image data
        width: Option<u32>,
        height: Option<u32>,
    },
    
    /// A block quote (indented content)
    BlockQuote {
        elements: Vec<LayoutElement>,
    },
    
    /// Ordered or unordered list
    List {
        ordered: bool,
        start: u32,              // Starting number for ordered lists
        items: Vec<Vec<LayoutElement>>,
    },
    
    /// Horizontal separator line
    HorizontalRule,
    
    /// Preformatted code block
    CodeBlock {
        language: Option<String>,
        code: String,
    },
    
    /// Table with headers and rows
    Table {
        headers: Vec<Vec<Vec<TextSpan>>>,  // Row -> Cell -> Spans
        rows: Vec<Vec<Vec<TextSpan>>>,
    },
    
    /// Figure with optional caption
    Figure {
        content: Box<LayoutElement>,
        caption: Option<Vec<TextSpan>>,
    },
    
    /// Raw unformatted text (fallback)
    RawText {
        text: String,
    },
}
```

### TextSpan

Styled text within an element:

```rust
pub struct TextSpan {
    pub text: String,
    pub style: SpanStyle,
}

pub struct SpanStyle {
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
    pub strikethrough: bool,
    pub link: Option<String>,        // href for links
    pub font_size_override: Option<f32>,
    pub color_override: Option<[u8; 4]>,  // RGBA
}
```

### Element Properties

```rust
impl LayoutElement {
    /// Extract all text content as plain string
    pub fn text_content(&self) -> String;
    
    /// Check if element should stay with next (e.g., headings)
    pub fn keep_with_next(&self) -> bool;
    
    /// Check if element is empty/whitespace-only
    pub fn is_empty(&self) -> bool;
}
```

---

## HTML Parsing

### Parser Entry Point

```rust
pub fn parse_html_to_elements(html: &str) -> Vec<LayoutElement>
```

Uses the `scraper` crate for DOM parsing with CSS selector support.

### Element Mapping

| HTML Tag | LayoutElement |
|----------|---------------|
| `<p>`, `<div>` | `Paragraph { indent: true }` |
| `<h1>`-`<h6>` | `Heading { level }` |
| `<blockquote>` | `BlockQuote` |
| `<ul>`, `<ol>` | `List` |
| `<img>` | `Image` |
| `<figure>` | `Figure` |
| `<hr>` | `HorizontalRule` |
| `<pre>` | `CodeBlock` |
| `<table>` | `Table` |

### Style Inheritance

Styles cascade through nested elements:

```rust
fn collect_text_spans_recursive(
    element: &ElementRef,
    inherited_style: &SpanStyle,  // Passed down
    spans: &mut Vec<TextSpan>,
) {
    for child in element.children() {
        let mut style = inherited_style.clone();
        
        match tag_name {
            "b" | "strong" => style.bold = true,
            "i" | "em" => style.italic = true,
            "a" => style.link = Some(href),
            // ...
        }
        
        // Recurse with merged style
        collect_text_spans_recursive(&child, &style, spans);
    }
}
```

### Whitespace Normalization

Whitespace is normalized to single spaces, preserving semantic breaks:

```rust
fn normalize_whitespace(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let mut prev_space = false;
    
    for c in text.chars() {
        if c.is_whitespace() {
            if !prev_space {
                result.push(' ');
                prev_space = true;
            }
        } else {
            result.push(c);
            prev_space = false;
        }
    }
    result
}
```

---

## Pagination Algorithm

### Overview

The paginator breaks content into fixed-height pages:

```rust
pub struct Paginator<'a> {
    settings: &'a ReaderSettings,
    font_manager: &'a FontManager,
}

impl Paginator {
    pub fn paginate(&self, document: &LayoutDocument) -> PaginatedBook;
}
```

### Page Structure

```rust
pub struct Page {
    pub index: usize,
    pub chapter_id: String,
    pub chapter_title: String,
    pub elements: Vec<PageElement>,
    pub content_height: f32,
}

pub struct PageElement {
    pub element: LayoutElement,
    pub y_position: f32,    // Position on page
    pub height: f32,        // Measured height
}
```

### Single-Column Algorithm

```rust
fn paginate_chapter(&self, chapter: &LayoutChapter) -> Vec<Page> {
    let available_height = settings.content_height();
    let mut current_y = 0.0;
    let mut current_elements = Vec::new();
    
    for element in &chapter.elements {
        let height = self.measure_element(element);
        
        // Page break if doesn't fit
        if current_y + height > available_height && !current_elements.is_empty() {
            pages.push(Page { elements: current_elements, ... });
            current_elements = Vec::new();
            current_y = 0.0;
        }
        
        // Handle keep-with-next (headings)
        if element.keep_with_next() {
            let next_height = self.measure_element(&next);
            if current_y + height + next_height > available_height {
                // Move heading to next page
                pages.push(Page { ... });
                current_y = 0.0;
            }
        }
        
        current_elements.push(PageElement {
            element: element.clone(),
            y_position: current_y,
            height,
        });
        current_y += height + paragraph_spacing;
    }
    
    pages
}
```

### Two-Column Layout

For two-column mode, elements are assigned to columns using a Y-offset marker:

```rust
fn paginate_two_column(&self, document: &LayoutDocument) -> PaginatedBook {
    // First pass: paginate as single columns
    let column_pages = self.paginate_single_column(document);
    
    // Pair columns into spreads
    let mut spreads = Vec::new();
    for chunk in column_pages.chunks(2) {
        let left = &chunk[0];
        let right = chunk.get(1);
        
        let mut elements = left.elements.clone();
        
        if let Some(right) = right {
            // Mark right column with Y offset
            let marker = content_height + 1.0;
            for elem in &right.elements {
                elements.push(PageElement {
                    y_position: elem.y_position + marker,
                    ..elem.clone()
                });
            }
        }
        
        spreads.push(Page { elements, ... });
    }
    
    PaginatedBook { pages: spreads }
}
```

### Element Height Measurement

Heights are calculated conservatively to prevent overflow:

```rust
fn measure_element(&self, element: &LayoutElement) -> f32 {
    match element {
        LayoutElement::Paragraph { spans, .. } => {
            self.measure_text_block(spans, settings.font_size)
        }
        LayoutElement::Heading { level, spans } => {
            let font_size = settings.heading_size(*level);
            let text_height = self.measure_text_block(spans, font_size);
            text_height + heading_spacing
        }
        LayoutElement::List { items, .. } => {
            items.iter().map(|item| {
                item.iter().map(|e| self.measure_element(e)).sum()
            }).sum()
        }
        // ... other elements
    }
}

fn measure_text_block(&self, spans: &[TextSpan], font_size: f32) -> f32 {
    let text: String = spans.iter().map(|s| &s.text).collect();
    let avg_char_width = font_size * 0.42;  // Conservative estimate
    let chars_per_line = content_width / avg_char_width;
    let line_count = (text.len() as f32 / chars_per_line).ceil();
    line_count * line_height_px
}
```

---

## Rendering Pipeline

### Renderer Structure

```rust
pub struct Renderer {
    text_renderer: TextRenderer,
    page_cache: HashMap<usize, CachedPage>,
    max_cache_size: usize,  // Default: 5
}
```

### Rendering Flow

```
render_page(index, width, height)
    │
    ├── Check cache → Return if hit
    │
    ├── Create pixel buffer (RGBA)
    │
    ├── Fill background color
    │
    ├── For each PageElement:
    │   ├── Determine column (from y_position marker)
    │   ├── Calculate render position
    │   └── render_element()
    │       ├── Paragraph → render_text_block()
    │       ├── Heading → render_text_block() with larger font
    │       ├── List → render markers + content
    │       ├── Image → decode and blit
    │       └── ... other elements
    │
    └── Cache result → Return pixels
```

### Text Rendering

Text is rendered glyph-by-glyph using fontdue:

```rust
fn render_text_block(&self, spans: &[TextSpan], x: f32, y: f32, ...) {
    let mut current_x = x;
    let mut current_y = y;
    
    for span in spans {
        // Select font variant based on style
        let font = match (span.style.bold, span.style.italic) {
            (true, _) => bold_font,
            (_, true) => italic_font,
            _ => regular_font,
        };
        
        for char in span.text.chars() {
            // Handle line breaks
            if char == '\n' {
                current_x = x;
                current_y += line_height;
                continue;
            }
            
            // Rasterize glyph
            let (metrics, bitmap) = font.rasterize(char, font_size);
            
            // Check for line wrap
            if current_x + metrics.advance_width > x + max_width {
                current_x = x;
                current_y += line_height;
            }
            
            // Render glyph to buffer
            text_renderer.render_glyph(
                pixels, bitmap, 
                glyph_x, glyph_y, 
                color, background
            );
            
            current_x += metrics.advance_width;
        }
    }
}
```

### Glyph Blending

Glyphs are alpha-blended onto the background:

```rust
fn render_glyph(&self, pixels: &mut [u8], bitmap: &[u8], ...) {
    for y in 0..glyph_height {
        for x in 0..glyph_width {
            let alpha = bitmap[y * width + x];
            if alpha == 0 { continue; }
            
            let dst_idx = (dst_y * canvas_width + dst_x) * 4;
            
            if alpha == 255 {
                // Fully opaque
                pixels[dst_idx] = color.r;
                pixels[dst_idx + 1] = color.g;
                pixels[dst_idx + 2] = color.b;
            } else {
                // Alpha blend
                let inv_alpha = 255 - alpha;
                pixels[dst_idx] = 
                    (color.r as u16 * alpha as u16 + 
                     bg.r as u16 * inv_alpha as u16) / 255;
                // ... g, b channels
            }
        }
    }
}
```

---

## Font Management

### FontManager Structure

```rust
pub struct FontManager {
    font_system: FontSystem,  // cosmic-text for shaping
    fonts: HashMap<String, FontFamily>,
    font_data: Vec<Vec<u8>>,  // Raw font data
}

pub struct FontFamily {
    pub name: String,
    pub variants: HashMap<FontStyle, Arc<FontdueFont>>,
}

pub enum FontStyle {
    Regular,
    Bold,
    Italic,
    BoldItalic,
}
```

### Font Loading

```rust
pub fn load_font(&mut self, name: &str, data: &[u8]) -> Result<()> {
    // Parse name: "Literata-Bold" → ("Literata", Bold)
    let (family_name, style) = Self::parse_font_name(name);
    
    // Load into fontdue for rasterization
    let fontdue_font = FontdueFont::from_bytes(data, settings)?;
    
    // Load into cosmic-text for shaping
    self.font_system.db_mut().load_font_data(data.to_vec());
    
    // Store in registry
    let family = self.fonts.entry(family_name)
        .or_insert_with(FontFamily::new);
    family.variants.insert(style, Arc::new(fontdue_font));
}
```

### Font Fallback

If a requested style isn't available, fall back to Regular:

```rust
pub fn get(&self, style: FontStyle) -> Option<&Arc<FontdueFont>> {
    self.variants.get(&style)
        .or_else(|| {
            if style != FontStyle::Regular {
                self.variants.get(&FontStyle::Regular)
            } else {
                None
            }
        })
}
```

---

## Text Selection

### Selection State

```rust
pub struct SelectionState {
    pub chars: Vec<PositionedChar>,    // All chars on page
    pub selection: Option<TextSelection>,
    pub is_selecting: bool,
    pub drag_start: Option<(f32, f32)>,
}

pub struct PositionedChar {
    pub char: char,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub text_index: usize,
    pub chapter_id: String,
}
```

### Selection Algorithm

1. **Start**: Record mouse position
2. **Update**: Find nearest characters at start/end positions
3. **End**: Collect text between start and end indices

```rust
pub fn update_selection(&mut self, x: f32, y: f32) {
    let start_char = self.nearest_char(start_x, start_y);
    let end_char = self.nearest_char(x, y);
    
    let (start_idx, end_idx) = if start < end {
        (start.text_index, end.text_index + 1)
    } else {
        (end.text_index, start.text_index + 1)
    };
    
    let text: String = self.chars.iter()
        .filter(|c| c.text_index >= start_idx && c.text_index < end_idx)
        .map(|c| c.char)
        .collect();
    
    self.selection = Some(TextSelection { start_idx, end_idx, text, ... });
}
```

### Selection Rectangles

Convert character positions to highlight rectangles:

```rust
pub fn get_selection_rects(&self) -> Vec<SelectionRect> {
    let mut rects = Vec::new();
    let mut current_line_y = None;
    
    for char in selected_chars {
        match current_line_y {
            None => {
                // Start new line
                current_line_y = Some(char.y);
                line_start_x = char.x;
            }
            Some(y) if same_line(char.y, y) => {
                // Extend current line
                line_end_x = char.x + char.width;
            }
            Some(_) => {
                // New line - save previous
                rects.push(SelectionRect { x, y, width, height });
                // Start new line
            }
        }
    }
    
    rects
}
```

---

## Caching Strategy

### Page Cache

Rendered pages are cached to avoid re-rendering:

```rust
struct CachedPage {
    pixels: Vec<u8>,
    width: u32,
    height: u32,
}

impl Renderer {
    fn render_page(&mut self, ...) -> Result<Vec<u8>> {
        // Check cache
        if let Some(cached) = self.page_cache.get(&page.index) {
            if cached.width == width && cached.height == height {
                return Ok(cached.pixels.clone());
            }
        }
        
        // Render...
        
        // LRU eviction
        if self.page_cache.len() >= self.max_cache_size {
            let oldest = self.page_cache.keys().next().copied();
            if let Some(key) = oldest {
                self.page_cache.remove(&key);
            }
        }
        
        // Store in cache
        self.page_cache.insert(page.index, CachedPage { ... });
    }
}
```

### Cache Invalidation

Cache is cleared when:
- Settings change (`update_settings()`)
- Book is unloaded (`unload_book()`)
- Dimensions change (detected in `render_page()`)
- Explicitly cleared (`clear_render_cache()`)

### Pre-rendering

Adjacent pages can be pre-rendered for smoother navigation:

```rust
pub fn prerender_pages(current: u32, width: u32, height: u32, range: u32) {
    let start = current.saturating_sub(range);
    let end = (current + range + 1).min(total_pages);
    
    for i in start..end {
        // Rendering populates the cache
        let _ = renderer.render_page(&pages[i], width, height, ...);
    }
}
```

---

## Performance Considerations

### Memory Usage

- **Book content**: Stored as `LayoutDocument` (text + structure)
- **Paginated book**: `Vec<Page>` with element references
- **Page cache**: Up to 5 rendered pages (~4MB each at 1000x1000 RGBA)
- **Fonts**: Raw TTF data + rasterized glyphs

### Optimization Tips

1. **Avoid large inline images** - They're decoded on every render
2. **Use appropriate cache size** - Balance memory vs. render time
3. **Pre-render during idle** - Call `prerender_pages()` after page turn
4. **Clear cache on resize** - Prevents stale dimension renders

### WASM Considerations

- **Linear memory**: Single contiguous memory block
- **No multithreading**: Single-threaded execution
- **JS boundary cost**: Minimize data crossing WASM/JS boundary
- **Garbage collection**: Rust manages memory, but JS GC applies to wasm-bindgen objects

---

## See Also

- [API Reference](./WASM-READER-API.md) - Public API documentation
- [Development Guide](./WASM-READER-DEVELOPMENT.md) - Build and development workflow
- [Architecture](./WASM-READER-ARCHITECTURE.md) - High-level design decisions

