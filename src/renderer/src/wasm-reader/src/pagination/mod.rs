//! Pagination module

mod paginator;

pub use paginator::{IndexedItem, IndexedLine, Page, PaginatedBook, Paginator};

// Re-export for future use
#[allow(unused_imports)]
pub use paginator::{AnchorPageMap, ChapterLayoutIndex, ChapterPageMap, PageElement, SearchResult};
