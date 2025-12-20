//! Font management module

mod loader;
mod metrics;

pub use loader::{FontManager, FontStyle};

// Re-export for future use
#[allow(unused_imports)]
pub use loader::FontFamily;
#[allow(unused_imports)]
pub use metrics::FontMetrics;

