//! Liberty Reader - WASM-based e-book reader with deterministic text layout
//!
//! This crate provides a WebAssembly module for rendering e-book content
//! to a pixel buffer with consistent cross-platform text layout.

mod error;
mod fonts;
mod layout;
mod pagination;
mod render;
mod selection;
mod settings;

use std::cell::RefCell;
use std::sync::Once;

use wasm_bindgen::prelude::*;

pub use error::ReaderError;
pub use settings::{Color, ReaderSettings, TextAlign};

use fonts::FontManager;
use layout::LayoutDocument;
use pagination::{PaginatedBook, Paginator};
use render::Renderer;
use selection::SelectionState;

// Global state for the reader
thread_local! {
    static READER_STATE: RefCell<Option<ReaderState>> = RefCell::new(None);
}

static INIT: Once = Once::new();

struct ReaderState {
    settings: ReaderSettings,
    font_manager: FontManager,
    document: Option<LayoutDocument>,
    paginated: Option<PaginatedBook>,
    renderer: Renderer,
    selection: SelectionState,
    #[allow(dead_code)]
    current_page: Option<usize>,
}

impl ReaderState {
    fn new() -> Self {
        Self {
            settings: ReaderSettings::default(),
            font_manager: FontManager::new(),
            document: None,
            paginated: None,
            renderer: Renderer::new(),
            selection: SelectionState::new(),
            current_page: None,
        }
    }
}

fn with_state<F, R>(f: F) -> Result<R, JsError>
where
    F: FnOnce(&mut ReaderState) -> Result<R, ReaderError>,
{
    READER_STATE.with(|state| {
        let mut state = state.borrow_mut();
        let state = state.as_mut().ok_or_else(|| JsError::new("Reader not initialized"))?;
        f(state).map_err(|e| JsError::new(&e.to_string()))
    })
}

/// Initialize the WASM reader module
/// Must be called before any other functions
#[wasm_bindgen]
pub fn init() -> Result<(), JsError> {
    INIT.call_once(|| {
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();
    });

    READER_STATE.with(|state| {
        let mut state = state.borrow_mut();
        if state.is_none() {
            *state = Some(ReaderState::new());
        }
    });

    Ok(())
}

/// Load a font into the reader
/// 
/// # Arguments
/// * `font_name` - Name to identify the font (e.g., "Literata", "Literata-Bold")
/// * `font_data` - Raw TTF/OTF font file data
#[wasm_bindgen]
pub fn load_font(font_name: &str, font_data: &[u8]) -> Result<(), JsError> {
    with_state(|state| {
        state.font_manager.load_font(font_name, font_data)?;
        // Update renderer with new font manager state
        state.renderer.set_font_manager(&state.font_manager);
        Ok(())
    })
}

/// Update reader settings
/// 
/// # Arguments
/// * `settings_json` - JSON string containing ReaderSettings
/// 
/// # Returns
/// JSON object with pagination info if a book is loaded
#[wasm_bindgen]
pub fn update_settings(settings_json: &str) -> Result<JsValue, JsError> {
    with_state(|state| {
        let new_settings: ReaderSettings = serde_json::from_str(settings_json)
            .map_err(|e| ReaderError::InvalidSettings(e.to_string()))?;
        
        state.settings = new_settings;
        state.renderer.update_settings(&state.settings);
        
        // If we have a document, re-paginate
        if let Some(ref doc) = state.document {
            let paginator = Paginator::new(&state.settings, &state.font_manager);
            let paginated = paginator.paginate(doc);
            let result = serde_json::json!({
                "totalPages": paginated.total_pages,
                "repaginated": true,
            });
            state.paginated = Some(paginated);
            Ok(serde_wasm_bindgen::to_value(&result)?)
        } else {
            let result = serde_json::json!({
                "totalPages": 0,
                "repaginated": false,
            });
            Ok(serde_wasm_bindgen::to_value(&result)?)
        }
    })
}

/// Load book content into the reader
/// 
/// # Arguments
/// * `book_content_json` - JSON string containing BookContent (chapters, references, etc.)
/// 
/// # Returns
/// JSON object with book metadata
#[wasm_bindgen]
pub fn load_book(book_content_json: &str) -> Result<JsValue, JsError> {
    with_state(|state| {
        let document = LayoutDocument::from_book_content_json(book_content_json)?;
        
        let chapter_count = document.chapters.len();
        state.document = Some(document);
        state.paginated = None; // Will be paginated when dimensions are known
        
        let result = serde_json::json!({
            "loaded": true,
            "chapterCount": chapter_count,
        });
        
        Ok(serde_wasm_bindgen::to_value(&result)?)
    })
}

/// Paginate the loaded book with specified dimensions
/// 
/// # Arguments
/// * `width` - Container width in pixels
/// * `height` - Container height in pixels
/// 
/// # Returns
/// JSON object with pagination results
#[wasm_bindgen]
pub fn paginate(width: u32, height: u32) -> Result<JsValue, JsError> {
    with_state(|state| {
        let document = state.document.as_ref()
            .ok_or(ReaderError::NoBookLoaded)?;
        
        // Update settings with container dimensions
        let mut settings = state.settings.clone();
        settings.container_width = width as f32;
        settings.container_height = height as f32;
        state.settings = settings;
        
        let paginator = Paginator::new(&state.settings, &state.font_manager);
        let paginated = paginator.paginate(document);
        
        let result = serde_json::json!({
            "totalPages": paginated.total_pages,
            "pageChapterMap": paginated.pages.iter().map(|p| {
                serde_json::json!({
                    "pageIndex": p.index,
                    "chapterId": p.chapter_id,
                    "chapterTitle": p.chapter_title,
                })
            }).collect::<Vec<_>>(),
        });
        
        state.paginated = Some(paginated);
        
        Ok(serde_wasm_bindgen::to_value(&result)?)
    })
}

/// Pre-render pages around the current page for smoother navigation
/// 
/// # Arguments
/// * `current_page` - Current page index
/// * `width` - Render width in pixels
/// * `height` - Render height in pixels
/// * `range` - Number of pages to pre-render before and after current
#[wasm_bindgen]
pub fn prerender_pages(current_page: u32, width: u32, height: u32, range: u32) -> Result<(), JsError> {
    with_state(|state| {
        let paginated = state.paginated.as_ref()
            .ok_or(ReaderError::NotPaginated)?;
        
        let total = paginated.total_pages;
        let start = current_page.saturating_sub(range) as usize;
        let end = ((current_page + range + 1) as usize).min(total);
        
        // Pre-render pages in range (they'll be cached by the renderer)
        for i in start..end {
            if let Some(page) = paginated.pages.get(i) {
                let _ = state.renderer.render_page(
                    page,
                    width,
                    height,
                    &state.settings,
                    &state.font_manager,
                );
            }
        }
        
        Ok(())
    })
}

/// Get pagination progress information
/// 
/// Useful for showing progress during pagination of large books
#[wasm_bindgen]
pub fn get_pagination_stats() -> Result<JsValue, JsError> {
    with_state(|state| {
        let doc = state.document.as_ref();
        let paginated = state.paginated.as_ref();
        
        let stats = serde_json::json!({
            "hasDocument": doc.is_some(),
            "isPaginated": paginated.is_some(),
            "totalChapters": doc.map(|d| d.chapters.len()).unwrap_or(0),
            "totalPages": paginated.map(|p| p.total_pages).unwrap_or(0),
        });
        
        Ok(serde_wasm_bindgen::to_value(&stats)?)
    })
}

/// Clear the page render cache
#[wasm_bindgen]
pub fn clear_render_cache() {
    READER_STATE.with(|state| {
        if let Some(ref mut state) = *state.borrow_mut() {
            state.renderer.clear_cache();
        }
    });
}

/// Render a specific page to a pixel buffer
/// 
/// # Arguments
/// * `page_index` - Zero-based page index
/// * `width` - Render width in pixels
/// * `height` - Render height in pixels
/// 
/// # Returns
/// RGBA pixel buffer as Vec<u8>
#[wasm_bindgen]
pub fn render_page(page_index: u32, width: u32, height: u32) -> Result<Vec<u8>, JsError> {
    with_state(|state| {
        let paginated = state.paginated.as_ref()
            .ok_or(ReaderError::NotPaginated)?;
        
        let page = paginated.pages.get(page_index as usize)
            .ok_or(ReaderError::PageNotFound(page_index))?;
        
        let pixels = state.renderer.render_page(
            page,
            width,
            height,
            &state.settings,
            &state.font_manager,
        )?;
        
        Ok(pixels)
    })
}

/// Get chapter info for a specific page
/// 
/// # Arguments
/// * `page_index` - Zero-based page index
/// 
/// # Returns
/// JSON object with chapter info
#[wasm_bindgen]
pub fn get_page_chapter(page_index: u32) -> Result<JsValue, JsError> {
    with_state(|state| {
        let paginated = state.paginated.as_ref()
            .ok_or(ReaderError::NotPaginated)?;
        
        let page = paginated.pages.get(page_index as usize)
            .ok_or(ReaderError::PageNotFound(page_index))?;
        
        let result = serde_json::json!({
            "chapterId": page.chapter_id,
            "chapterTitle": page.chapter_title,
        });
        
        Ok(serde_wasm_bindgen::to_value(&result)?)
    })
}

/// Search for text in the loaded book
/// 
/// # Arguments
/// * `query` - Search query string
/// 
/// # Returns
/// JSON array of search results
#[wasm_bindgen]
pub fn search_text(query: &str) -> Result<JsValue, JsError> {
    with_state(|state| {
        let paginated = state.paginated.as_ref()
            .ok_or(ReaderError::NotPaginated)?;
        
        let results = paginated.search(query);
        Ok(serde_wasm_bindgen::to_value(&results)?)
    })
}

/// Clean up resources when closing a book
#[wasm_bindgen]
pub fn unload_book() {
    READER_STATE.with(|state| {
        if let Some(ref mut state) = *state.borrow_mut() {
            state.document = None;
            state.paginated = None;
            state.renderer.clear_cache();
        }
    });
}

/// Get the current settings as JSON
#[wasm_bindgen]
pub fn get_settings() -> Result<JsValue, JsError> {
    with_state(|state| {
        Ok(serde_wasm_bindgen::to_value(&state.settings)?)
    })
}

// ============================================================================
// Selection API
// ============================================================================

/// Start text selection at the given coordinates
#[wasm_bindgen]
pub fn selection_start(x: f32, y: f32) {
    READER_STATE.with(|state| {
        if let Some(ref mut state) = *state.borrow_mut() {
            state.selection.start_selection(x, y);
        }
    });
}

/// Update text selection during drag
#[wasm_bindgen]
pub fn selection_update(x: f32, y: f32) {
    READER_STATE.with(|state| {
        if let Some(ref mut state) = *state.borrow_mut() {
            state.selection.update_selection(x, y);
        }
    });
}

/// End text selection and return the selected text
#[wasm_bindgen]
pub fn selection_end() -> Result<JsValue, JsError> {
    READER_STATE.with(|state| {
        let mut state = state.borrow_mut();
        let state = state.as_mut().ok_or_else(|| JsError::new("Reader not initialized"))?;
        
        let selection = state.selection.end_selection();
        Ok(serde_wasm_bindgen::to_value(&selection)?)
    })
}

/// Clear the current selection
#[wasm_bindgen]
pub fn selection_clear() {
    READER_STATE.with(|state| {
        if let Some(ref mut state) = *state.borrow_mut() {
            state.selection.clear_selection();
        }
    });
}

/// Get selection rectangles for highlighting
#[wasm_bindgen]
pub fn get_selection_rects() -> Result<JsValue, JsError> {
    with_state(|state| {
        let rects = state.selection.get_selection_rects();
        Ok(serde_wasm_bindgen::to_value(&rects)?)
    })
}

/// Get the currently selected text
#[wasm_bindgen]
pub fn get_selected_text() -> Result<JsValue, JsError> {
    with_state(|state| {
        let text = state.selection.selection.as_ref().map(|s| s.text.clone());
        Ok(serde_wasm_bindgen::to_value(&text)?)
    })
}

// ============================================================================
// Link Detection API
// ============================================================================

/// Check if there is a link at the given position
/// Returns the link href if found, null otherwise
#[wasm_bindgen]
pub fn get_link_at_position(page_index: u32, x: f32, y: f32) -> Result<JsValue, JsError> {
    with_state(|state| {
        let paginated = state.paginated.as_ref()
            .ok_or(ReaderError::NotPaginated)?;

        // Verify page exists (but we don't need it for link detection)
        let _page = paginated.pages.get(page_index as usize)
            .ok_or(ReaderError::PageNotFound(page_index))?;
        
        // Find link at position by checking the character positions
        // and their associated link data
        if let Some(char_pos) = state.selection.char_at_position(x, y) {
            // Check if this character is part of a link span
            // For now, return None - full implementation would track links during rendering
            let _ = char_pos;
        }
        
        // Placeholder - full implementation needs link tracking during render
        Ok(serde_wasm_bindgen::to_value(&None::<String>)?)
    })
}

