//! Layout document model

mod document;
mod html_parser;

pub use document::{LayoutChapter, LayoutDocument, LayoutElement, TextSpan};

// SpanStyle is used internally and may be needed for future features
#[allow(unused_imports)]
pub use document::SpanStyle;

