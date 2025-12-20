//! Pagination module

mod paginator;

pub use paginator::{Page, PaginatedBook, Paginator};

// Re-export for future use
#[allow(unused_imports)]
pub use paginator::{PageElement, SearchResult};

