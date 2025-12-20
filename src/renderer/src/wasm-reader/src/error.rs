//! Error types for the Liberty Reader

use thiserror::Error;

/// Errors that can occur in the reader
#[derive(Error, Debug)]
pub enum ReaderError {
    #[error("Invalid settings: {0}")]
    InvalidSettings(String),

    #[error("Failed to parse book content: {0}")]
    ParseError(String),

    #[error("No book is currently loaded")]
    NoBookLoaded,

    #[error("Book has not been paginated yet")]
    NotPaginated,

    #[error("Page {0} not found")]
    PageNotFound(u32),

    #[error("Font error: {0}")]
    FontError(String),

    #[error("Render error: {0}")]
    RenderError(String),

    #[error("Image decode error: {0}")]
    ImageError(String),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("WASM serialization error: {0}")]
    WasmSerializationError(String),
}

impl From<serde_wasm_bindgen::Error> for ReaderError {
    fn from(err: serde_wasm_bindgen::Error) -> Self {
        ReaderError::WasmSerializationError(err.to_string())
    }
}

