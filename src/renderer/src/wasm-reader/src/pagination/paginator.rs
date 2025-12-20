//! Deterministic pagination algorithm

use serde::{Deserialize, Serialize};

use crate::fonts::FontManager;
use crate::layout::{LayoutChapter, LayoutDocument, LayoutElement, TextSpan};
use crate::settings::ReaderSettings;

/// A positioned element on a page
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageElement {
    /// The layout element
    pub element: LayoutElement,
    /// Y position from top of content area
    pub y_position: f32,
    /// Calculated height
    pub height: f32,
}

/// A single page of content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    /// Zero-based page index
    pub index: usize,
    /// Chapter ID this page belongs to
    pub chapter_id: String,
    /// Chapter title
    pub chapter_title: String,
    /// Elements on this page with positions
    pub elements: Vec<PageElement>,
    /// Total height of content on this page
    pub content_height: f32,
}

impl Page {
    /// Get all text content for searching
    pub fn text_content(&self) -> String {
        self.elements
            .iter()
            .map(|e| e.element.text_content())
            .collect::<Vec<_>>()
            .join("\n")
    }
}

/// Search result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub page_index: usize,
    pub chapter_id: String,
    pub chapter_title: String,
    pub snippet: String,
    pub match_start: usize,
    pub match_end: usize,
}

/// The paginated book
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedBook {
    pub pages: Vec<Page>,
    pub total_pages: usize,
}

impl PaginatedBook {
    /// Search for text in all pages
    pub fn search(&self, query: &str) -> Vec<SearchResult> {
        let query_lower = query.to_lowercase();
        let mut results = Vec::new();

        for page in &self.pages {
            let text = page.text_content();
            let text_lower = text.to_lowercase();

            let mut search_start = 0;
            while let Some(pos) = text_lower[search_start..].find(&query_lower) {
                let match_start = search_start + pos;
                let match_end = match_start + query.len();

                // Create snippet with context
                let snippet_start = match_start.saturating_sub(40);
                let snippet_end = (match_end + 40).min(text.len());
                let mut snippet = text[snippet_start..snippet_end].to_string();

                if snippet_start > 0 {
                    snippet = format!("...{}", snippet);
                }
                if snippet_end < text.len() {
                    snippet = format!("{}...", snippet);
                }

                results.push(SearchResult {
                    page_index: page.index,
                    chapter_id: page.chapter_id.clone(),
                    chapter_title: page.chapter_title.clone(),
                    snippet,
                    match_start,
                    match_end,
                });

                search_start = match_end;
            }
        }

        results
    }
}

/// Paginator that breaks content into pages
pub struct Paginator<'a> {
    settings: &'a ReaderSettings,
    #[allow(dead_code)]
    font_manager: &'a FontManager,
}

impl<'a> Paginator<'a> {
    pub fn new(settings: &'a ReaderSettings, font_manager: &'a FontManager) -> Self {
        Self {
            settings,
            font_manager,
        }
    }

    /// Paginate the entire document
    pub fn paginate(&self, document: &LayoutDocument) -> PaginatedBook {
        let available_height = self.settings.content_height();
        
        if self.settings.columns >= 2 {
            // In 2-column mode, we create "column pages" first, then pair them
            self.paginate_two_column(document, available_height)
        } else {
            // Single column mode - standard pagination
            self.paginate_single_column(document, available_height)
        }
    }

    /// Paginate for single column layout
    fn paginate_single_column(&self, document: &LayoutDocument, available_height: f32) -> PaginatedBook {
        let mut pages = Vec::new();

        for chapter in &document.chapters {
            let chapter_pages = self.paginate_chapter(chapter, pages.len(), available_height);
            pages.extend(chapter_pages);
        }

        let total_pages = pages.len();
        PaginatedBook { pages, total_pages }
    }

    /// Paginate for two column layout
    /// Each visual "page" contains two columns worth of content
    fn paginate_two_column(&self, document: &LayoutDocument, available_height: f32) -> PaginatedBook {
        // First, create column-sized pages (each column is a "page")
        let mut column_pages = Vec::new();

        for chapter in &document.chapters {
            let chapter_pages = self.paginate_chapter(chapter, column_pages.len(), available_height);
            column_pages.extend(chapter_pages);
        }

        // Now pair columns into spreads (2 columns per visual page)
        let mut pages = Vec::new();
        let mut i = 0;
        
        while i < column_pages.len() {
            let left_column = &column_pages[i];
            
            // Create a page with left column content
            // The page index is the spread index, not column index
            let spread_index = pages.len();
            
            let mut combined_elements = Vec::new();
            
            // Add left column elements (column 0)
            for elem in &left_column.elements {
                combined_elements.push(PageElement {
                    element: elem.element.clone(),
                    y_position: elem.y_position,
                    height: elem.height,
                });
            }
            
            // If there's a right column, add its elements with an offset marker
            // We'll use the y_position to encode column (add a large offset for column 2)
            let column_height_marker = available_height + 1.0; // Marker to identify column 2
            
            if i + 1 < column_pages.len() {
                let right_column = &column_pages[i + 1];
                for elem in &right_column.elements {
                    combined_elements.push(PageElement {
                        element: elem.element.clone(),
                        y_position: elem.y_position + column_height_marker, // Offset for column 2
                        height: elem.height,
                    });
                }
            }
            
            pages.push(Page {
                index: spread_index,
                chapter_id: left_column.chapter_id.clone(),
                chapter_title: left_column.chapter_title.clone(),
                elements: combined_elements,
                content_height: left_column.content_height,
            });
            
            i += 2; // Move by 2 columns
        }

        let total_pages = pages.len();
        PaginatedBook { pages, total_pages }
    }

    /// Paginate a single chapter
    fn paginate_chapter(
        &self,
        chapter: &LayoutChapter,
        start_page_index: usize,
        available_height: f32,
    ) -> Vec<Page> {
        let mut pages = Vec::new();
        let mut current_elements: Vec<PageElement> = Vec::new();
        let mut current_y = 0.0;

        for (i, element) in chapter.elements.iter().enumerate() {
            let element_height = self.measure_element(element);

            // Check if this element fits on current page
            if current_y + element_height > available_height && !current_elements.is_empty() {
                // Create page with current content
                pages.push(Page {
                    index: start_page_index + pages.len(),
                    chapter_id: chapter.id.clone(),
                    chapter_title: chapter.title.clone(),
                    elements: std::mem::take(&mut current_elements),
                    content_height: current_y,
                });
                current_y = 0.0;
            }

            // Handle keep-with-next (e.g., headings)
            if element.keep_with_next() && i + 1 < chapter.elements.len() {
                let next_height = self.measure_element(&chapter.elements[i + 1]);
                let combined = element_height + next_height;

                // If heading + next element doesn't fit, move heading to next page
                if current_y + combined > available_height && !current_elements.is_empty() {
                    pages.push(Page {
                        index: start_page_index + pages.len(),
                        chapter_id: chapter.id.clone(),
                        chapter_title: chapter.title.clone(),
                        elements: std::mem::take(&mut current_elements),
                        content_height: current_y,
                    });
                    current_y = 0.0;
                }
            }

            // Add element to current page
            current_elements.push(PageElement {
                element: element.clone(),
                y_position: current_y,
                height: element_height,
            });
            current_y += element_height;

            // Add spacing after element (unless it's a heading - spacing handled differently)
            if !matches!(element, LayoutElement::Heading { .. }) {
                current_y += self.settings.paragraph_spacing;
            }
        }

        // Add remaining content as final page
        if !current_elements.is_empty() {
            pages.push(Page {
                index: start_page_index + pages.len(),
                chapter_id: chapter.id.clone(),
                chapter_title: chapter.title.clone(),
                elements: current_elements,
                content_height: current_y,
            });
        }

        // Ensure at least one page per chapter
        if pages.is_empty() {
            pages.push(Page {
                index: start_page_index,
                chapter_id: chapter.id.clone(),
                chapter_title: chapter.title.clone(),
                elements: Vec::new(),
                content_height: 0.0,
            });
        }

        pages
    }

    /// Measure the height of a layout element
    fn measure_element(&self, element: &LayoutElement) -> f32 {
        match element {
            LayoutElement::Paragraph { spans, .. } => {
                self.measure_text_block(spans, self.settings.font_size)
            }

            LayoutElement::Heading { level, spans } => {
                let font_size = self.settings.heading_size(*level);
                let text_height = self.measure_text_block(spans, font_size);
                // Add extra spacing for headings
                let spacing = match level {
                    1 => self.settings.font_size * 1.5,
                    2 => self.settings.font_size * 1.2,
                    _ => self.settings.font_size * 0.8,
                };
                text_height + spacing
            }

            LayoutElement::BlockQuote { elements } => {
                let mut height = 0.0;
                for el in elements {
                    height += self.measure_element(el);
                    height += self.settings.paragraph_spacing * 0.5;
                }
                // Add blockquote padding
                height + self.settings.font_size * 0.5
            }

            LayoutElement::List { items, .. } => {
                let mut height = 0.0;
                for item in items {
                    for el in item {
                        height += self.measure_element(el);
                    }
                    height += self.settings.line_height_px() * 0.3; // Item spacing
                }
                height
            }

            LayoutElement::Image { height: img_height, width: img_width, .. } => {
                // Get available dimensions
                let available_height = self.settings.content_height();
                let content_width = self.settings.content_width();
                
                // Get raw dimensions or use defaults
                let raw_height = img_height.map(|h| h as f32).unwrap_or(200.0);
                let raw_width = img_width.map(|w| w as f32).unwrap_or(content_width);
                
                // Scale image to fit within page bounds while maintaining aspect ratio
                let scale_for_width = if raw_width > content_width {
                    content_width / raw_width
                } else {
                    1.0
                };
                
                let scale_for_height = if raw_height > available_height {
                    available_height / raw_height
                } else {
                    1.0
                };
                
                let scale = scale_for_width.min(scale_for_height);
                let final_height = raw_height * scale;
                
                final_height
            }

            LayoutElement::Figure { content, caption } => {
                let mut height = self.measure_element(content);
                if let Some(cap_spans) = caption {
                    height += self.measure_text_block(cap_spans, self.settings.font_size * 0.9);
                    height += self.settings.font_size * 0.5; // Caption spacing
                }
                height
            }

            LayoutElement::HorizontalRule => {
                self.settings.font_size * 2.0 // Rule with spacing
            }

            LayoutElement::CodeBlock { code, .. } => {
                let line_count = code.lines().count().max(1);
                let code_line_height = self.settings.font_size * 1.4;
                (line_count as f32 * code_line_height) + self.settings.font_size // Padding
            }

            LayoutElement::Table { headers, rows } => {
                let row_count = headers.len() + rows.len();
                let row_height = self.settings.line_height_px() * 1.5;
                (row_count as f32 * row_height) + self.settings.font_size // Padding
            }

            LayoutElement::RawText { text } => {
                let line_count = (text.len() as f32 / 60.0).ceil().max(1.0);
                line_count * self.settings.line_height_px()
            }
        }
    }

    /// Measure the height of a text block
    /// 
    /// Uses conservative estimates to prevent text overflow.
    /// The actual rendering may use less space, but we ensure
    /// content always fits within the page boundaries.
    fn measure_text_block(&self, spans: &[TextSpan], font_size: f32) -> f32 {
        // Calculate total text length
        let total_text: String = spans.iter().map(|s| s.text.as_str()).collect();
        
        if total_text.is_empty() {
            return 0.0;
        }

        let content_width = self.settings.content_width();
        
        // Conservative character width estimate
        // For most fonts, average character width is about 0.45-0.55 of font size
        // We use 0.42 to be conservative and prevent overflow
        let avg_char_width = font_size * 0.42;
        
        // Account for potential word-wrapping overhead
        // When words wrap, we may lose some line space
        let effective_width = content_width * 0.95;
        
        let chars_per_line = (effective_width / avg_char_width).max(1.0);
        
        // Count lines, accounting for:
        // 1. Hard line breaks in the text
        // 2. Soft wrapping based on width
        let mut line_count = 0.0;
        
        for line in total_text.split('\n') {
            if line.is_empty() {
                line_count += 1.0;
            } else {
                // For each segment, calculate wrapped lines
                line_count += (line.len() as f32 / chars_per_line).ceil();
            }
        }
        
        // Ensure at least 1 line
        line_count = line_count.max(1.0);
        
        // Calculate height with line spacing
        let line_height = font_size * self.settings.line_height;
        line_count * line_height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_settings() -> ReaderSettings {
        let mut settings = ReaderSettings::default();
        settings.container_width = 800.0;
        settings.container_height = 600.0;
        settings
    }

    #[test]
    fn test_paginate_empty_document() {
        let font_manager = FontManager::new();
        let settings = test_settings();
        let paginator = Paginator::new(&settings, &font_manager);
        
        let document = LayoutDocument::new();
        let result = paginator.paginate(&document);
        
        assert_eq!(result.total_pages, 0);
    }

    #[test]
    fn test_search() {
        let book = PaginatedBook {
            pages: vec![
                Page {
                    index: 0,
                    chapter_id: "ch1".to_string(),
                    chapter_title: "Chapter 1".to_string(),
                    elements: vec![PageElement {
                        element: LayoutElement::Paragraph {
                            spans: vec![crate::layout::TextSpan::new("Hello world, this is a test")],
                            indent: true,
                        },
                        y_position: 0.0,
                        height: 20.0,
                    }],
                    content_height: 20.0,
                },
            ],
            total_pages: 1,
        };

        let results = book.search("world");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].page_index, 0);
        assert!(results[0].snippet.contains("world"));
    }
}

