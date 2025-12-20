//! Layout document types

use serde::{Deserialize, Serialize};

use crate::error::ReaderError;

use super::html_parser::parse_html_to_elements;

/// A styled text span
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextSpan {
    pub text: String,
    pub style: SpanStyle,
}

impl TextSpan {
    pub fn new(text: &str) -> Self {
        Self {
            text: text.to_string(),
            style: SpanStyle::default(),
        }
    }

    pub fn with_style(text: &str, style: SpanStyle) -> Self {
        Self {
            text: text.to_string(),
            style,
        }
    }
}

/// Style properties for a text span
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SpanStyle {
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
    pub strikethrough: bool,
    pub link: Option<String>,
    pub font_size_override: Option<f32>,
    pub color_override: Option<[u8; 4]>,
}

#[allow(dead_code)]
impl SpanStyle {
    pub fn bold() -> Self {
        Self {
            bold: true,
            ..Default::default()
        }
    }

    pub fn italic() -> Self {
        Self {
            italic: true,
            ..Default::default()
        }
    }

    pub fn link(href: &str) -> Self {
        Self {
            link: Some(href.to_string()),
            ..Default::default()
        }
    }

    pub fn merge(&self, other: &SpanStyle) -> SpanStyle {
        SpanStyle {
            bold: self.bold || other.bold,
            italic: self.italic || other.italic,
            underline: self.underline || other.underline,
            strikethrough: self.strikethrough || other.strikethrough,
            link: other.link.clone().or_else(|| self.link.clone()),
            font_size_override: other.font_size_override.or(self.font_size_override),
            color_override: other.color_override.or(self.color_override),
        }
    }
}

/// A layout element representing a block of content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LayoutElement {
    /// A paragraph of text
    Paragraph {
        spans: Vec<TextSpan>,
        indent: bool,
    },
    /// A heading (h1-h6)
    Heading {
        level: u8,
        spans: Vec<TextSpan>,
    },
    /// An image
    Image {
        src: String,
        alt: String,
        data: Option<Vec<u8>>,
        width: Option<u32>,
        height: Option<u32>,
    },
    /// A block quote
    BlockQuote {
        elements: Vec<LayoutElement>,
    },
    /// An ordered or unordered list
    List {
        ordered: bool,
        start: u32,
        items: Vec<Vec<LayoutElement>>,
    },
    /// A horizontal rule
    HorizontalRule,
    /// A code block
    CodeBlock {
        language: Option<String>,
        code: String,
    },
    /// A table (simplified)
    /// Each row is a Vec of cells, each cell is a Vec<TextSpan>
    Table {
        headers: Vec<Vec<Vec<TextSpan>>>,
        rows: Vec<Vec<Vec<TextSpan>>>,
    },
    /// A figure with optional caption
    Figure {
        content: Box<LayoutElement>,
        caption: Option<Vec<TextSpan>>,
    },
    /// Raw text (fallback)
    RawText {
        text: String,
    },
}

impl LayoutElement {
    /// Get all text content as a plain string
    pub fn text_content(&self) -> String {
        match self {
            LayoutElement::Paragraph { spans, .. } => {
                spans.iter().map(|s| s.text.as_str()).collect::<Vec<_>>().join("")
            }
            LayoutElement::Heading { spans, .. } => {
                spans.iter().map(|s| s.text.as_str()).collect::<Vec<_>>().join("")
            }
            LayoutElement::BlockQuote { elements } => {
                elements.iter().map(|e| e.text_content()).collect::<Vec<_>>().join("\n")
            }
            LayoutElement::List { items, .. } => {
                items.iter()
                    .map(|item| item.iter().map(|e| e.text_content()).collect::<Vec<_>>().join(""))
                    .collect::<Vec<_>>()
                    .join("\n")
            }
            LayoutElement::CodeBlock { code, .. } => code.clone(),
            LayoutElement::RawText { text } => text.clone(),
            LayoutElement::Figure { content, caption } => {
                let mut text = content.text_content();
                if let Some(cap) = caption {
                    text.push('\n');
                    text.push_str(&cap.iter().map(|s| s.text.as_str()).collect::<Vec<_>>().join(""));
                }
                text
            }
            LayoutElement::Table { headers, rows } => {
                let mut text = String::new();
                for row in headers.iter().chain(rows.iter()) {
                    for cell in row {
                        text.push_str(&cell.iter().map(|span| span.text.as_str()).collect::<Vec<_>>().join(""));
                        text.push('\t');
                    }
                    text.push('\n');
                }
                text
            }
            _ => String::new(),
        }
    }

    /// Check if this element should keep with the next element (e.g., headings)
    pub fn keep_with_next(&self) -> bool {
        matches!(self, LayoutElement::Heading { .. })
    }

    /// Check if this is an empty element
    pub fn is_empty(&self) -> bool {
        match self {
            LayoutElement::Paragraph { spans, .. } => spans.is_empty() || spans.iter().all(|s| s.text.trim().is_empty()),
            LayoutElement::Heading { spans, .. } => spans.is_empty() || spans.iter().all(|s| s.text.trim().is_empty()),
            LayoutElement::BlockQuote { elements } => elements.is_empty(),
            LayoutElement::List { items, .. } => items.is_empty(),
            LayoutElement::RawText { text } => text.trim().is_empty(),
            _ => false,
        }
    }
}

/// A chapter in the layout document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutChapter {
    pub id: String,
    pub title: String,
    pub elements: Vec<LayoutElement>,
}

impl LayoutChapter {
    pub fn new(id: &str, title: &str) -> Self {
        Self {
            id: id.to_string(),
            title: title.to_string(),
            elements: Vec::new(),
        }
    }

    /// Get total text content for searching
    #[allow(dead_code)]
    pub fn text_content(&self) -> String {
        self.elements
            .iter()
            .map(|e| e.text_content())
            .collect::<Vec<_>>()
            .join("\n")
    }
}

/// The complete layout document representing a book
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutDocument {
    pub chapters: Vec<LayoutChapter>,
}

impl LayoutDocument {
    pub fn new() -> Self {
        Self {
            chapters: Vec::new(),
        }
    }

    /// Parse from BookContent JSON (matching TypeScript BookContent type)
    pub fn from_book_content_json(json: &str) -> Result<Self, ReaderError> {
        #[derive(Deserialize)]
        struct BookContent {
            chapters: Vec<BookChapter>,
        }

        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct BookChapter {
            id: String,
            title: String,
            html_content: String,
        }

        let content: BookContent = serde_json::from_str(json)
            .map_err(|e| ReaderError::ParseError(e.to_string()))?;

        let mut document = LayoutDocument::new();

        for chapter in content.chapters {
            let elements = parse_html_to_elements(&chapter.html_content);
            let mut layout_chapter = LayoutChapter::new(&chapter.id, &chapter.title);
            layout_chapter.elements = elements;
            document.chapters.push(layout_chapter);
        }

        Ok(document)
    }

    /// Get total text for the entire document
    #[allow(dead_code)]
    pub fn text_content(&self) -> String {
        self.chapters
            .iter()
            .map(|c| c.text_content())
            .collect::<Vec<_>>()
            .join("\n\n")
    }
}

impl Default for LayoutDocument {
    fn default() -> Self {
        Self::new()
    }
}

