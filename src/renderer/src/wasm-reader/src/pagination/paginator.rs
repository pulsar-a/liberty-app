//! Font-shaped chapter indexing and deterministic pagination.

use cosmic_text::{Attrs, Buffer, Family, LayoutGlyph, Metrics, Shaping, Style, Weight, Wrap};
use serde::{Deserialize, Serialize};

use crate::fonts::FontManager;
use crate::layout::{LayoutChapter, LayoutDocument, LayoutElement, SpanStyle, TextSpan};
use crate::settings::{Color, ReaderSettings, TextAlign};

#[derive(Debug, Clone)]
pub struct IndexedGlyph {
    pub glyph: LayoutGlyph,
    pub color: Color,
    pub underline: bool,
    pub strikethrough: bool,
    #[allow(dead_code)]
    pub link: Option<String>,
    #[allow(dead_code)]
    pub source_start: usize,
    #[allow(dead_code)]
    pub source_end: usize,
}

#[derive(Debug, Clone)]
pub struct IndexedLine {
    pub glyphs: Vec<IndexedGlyph>,
    pub text: String,
    #[allow(dead_code)]
    pub width: f32,
    pub height: f32,
    pub baseline_offset: f32,
    pub x_offset: f32,
    pub quote_depth: u8,
}

#[derive(Debug, Clone)]
pub enum IndexedItem {
    Line(IndexedLine),
    Image {
        data: Vec<u8>,
        width: f32,
        height: f32,
        alt: String,
    },
    HorizontalRule {
        height: f32,
    },
}

impl IndexedItem {
    fn height(&self) -> f32 {
        match self {
            Self::Line(line) => line.height,
            Self::Image { height, .. } => *height,
            Self::HorizontalRule { height } => *height,
        }
    }

    fn text_content(&self) -> &str {
        match self {
            Self::Line(line) => &line.text,
            Self::Image { alt, .. } => alt,
            Self::HorizontalRule { .. } => "",
        }
    }
}

#[derive(Debug, Clone)]
struct IndexedBlock {
    items: Vec<IndexedItem>,
    spacing_after: f32,
    keep_with_next: bool,
    anchors: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct ChapterLayoutIndex {
    pub chapter_id: String,
    pub chapter_title: String,
    blocks: Vec<IndexedBlock>,
}

#[derive(Debug, Clone)]
pub struct PageElement {
    pub item: IndexedItem,
    pub x_position: f32,
    pub y_position: f32,
    pub column: u8,
}

#[derive(Debug, Clone)]
pub struct Page {
    pub index: usize,
    pub chapter_id: String,
    pub chapter_title: String,
    pub elements: Vec<PageElement>,
    pub content_height: f32,
}

impl Page {
    pub fn text_content(&self) -> String {
        self.elements
            .iter()
            .map(|element| element.item.text_content())
            .filter(|text| !text.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    }
}

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

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterPageMap {
    pub chapter_id: String,
    pub chapter_title: String,
    pub first_page_index: usize,
    pub page_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnchorPageMap {
    pub chapter_id: String,
    pub anchor_id: String,
    pub page_index: usize,
}

#[derive(Debug, Clone)]
pub struct PaginatedBook {
    pub pages: Vec<Page>,
    pub total_pages: usize,
    pub chapter_page_map: Vec<ChapterPageMap>,
    pub anchor_page_map: Vec<AnchorPageMap>,
}

impl PaginatedBook {
    pub fn search(&self, query: &str) -> Vec<SearchResult> {
        if query.is_empty() {
            return Vec::new();
        }

        let query_lower = query.to_lowercase();
        let mut results = Vec::new();

        for page in &self.pages {
            let text = page.text_content();
            let text_lower = text.to_lowercase();
            let mut search_start = 0;

            while let Some(pos) = text_lower[search_start..].find(&query_lower) {
                let match_start = search_start + pos;
                let match_end = match_start + query_lower.len();
                if !text.is_char_boundary(match_start) || !text.is_char_boundary(match_end) {
                    break;
                }

                let mut snippet_start = match_start.saturating_sub(40);
                while !text.is_char_boundary(snippet_start) {
                    snippet_start += 1;
                }
                let mut snippet_end = (match_end + 40).min(text.len());
                while !text.is_char_boundary(snippet_end) {
                    snippet_end -= 1;
                }

                let mut snippet = text[snippet_start..snippet_end].to_string();
                if snippet_start > 0 {
                    snippet.insert_str(0, "...");
                }
                if snippet_end < text.len() {
                    snippet.push_str("...");
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

pub struct Paginator<'a> {
    settings: &'a ReaderSettings,
    font_manager: &'a mut FontManager,
}

impl<'a> Paginator<'a> {
    pub fn new(settings: &'a ReaderSettings, font_manager: &'a mut FontManager) -> Self {
        Self {
            settings,
            font_manager,
        }
    }

    pub fn paginate(&mut self, document: &LayoutDocument) -> PaginatedBook {
        let mut pages = Vec::new();
        let mut chapter_page_map = Vec::new();
        let mut anchor_page_map = Vec::new();

        for chapter in &document.chapters {
            let first_page_index = pages.len();
            let index = self.index_chapter(chapter);
            let (mut chapter_pages, anchors) = self.paginate_chapter(&index, first_page_index);
            let page_count = chapter_pages.len();

            chapter_page_map.push(ChapterPageMap {
                chapter_id: chapter.id.clone(),
                chapter_title: chapter.title.clone(),
                first_page_index,
                page_count,
            });
            anchor_page_map.extend(anchors);
            pages.append(&mut chapter_pages);
        }

        let total_pages = pages.len();
        PaginatedBook {
            pages,
            total_pages,
            chapter_page_map,
            anchor_page_map,
        }
    }

    fn index_chapter(&mut self, chapter: &LayoutChapter) -> ChapterLayoutIndex {
        let mut blocks = Vec::new();
        let mut pending_anchors = Vec::new();

        for element in &chapter.elements {
            self.index_element(element, 0, &mut pending_anchors, &mut blocks);
        }

        if !pending_anchors.is_empty() {
            blocks.push(IndexedBlock {
                items: Vec::new(),
                spacing_after: 0.0,
                keep_with_next: false,
                anchors: pending_anchors,
            });
        }

        ChapterLayoutIndex {
            chapter_id: chapter.id.clone(),
            chapter_title: chapter.title.clone(),
            blocks,
        }
    }

    fn index_element(
        &mut self,
        element: &LayoutElement,
        quote_depth: u8,
        pending_anchors: &mut Vec<String>,
        blocks: &mut Vec<IndexedBlock>,
    ) {
        match element {
            LayoutElement::Container { elements } => {
                for child in elements {
                    self.index_element(child, quote_depth, pending_anchors, blocks);
                }
            }
            LayoutElement::Anchor { id } => pending_anchors.push(id.clone()),
            LayoutElement::Paragraph { spans, indent } => {
                collect_span_anchors(spans, pending_anchors);
                let quote_padding = quote_depth as f32 * self.settings.font_size;
                let indent = if *indent {
                    self.settings.paragraph_indent
                } else {
                    0.0
                };
                let lines = self.shape_lines(
                    spans,
                    self.settings.font_size,
                    (self.settings.content_width() - quote_padding - indent).max(1.0),
                    indent + quote_padding,
                    quote_depth,
                    self.settings.text_align,
                    &self.settings.text_color,
                );
                self.push_text_block(lines, false, pending_anchors, blocks);
            }
            LayoutElement::Heading { level, spans } => {
                collect_span_anchors(spans, pending_anchors);
                let font_size = self.settings.heading_size(*level);
                let quote_padding = quote_depth as f32 * self.settings.font_size;
                let lines = self.shape_lines(
                    spans,
                    font_size,
                    (self.settings.content_width() - quote_padding).max(1.0),
                    quote_padding,
                    quote_depth,
                    TextAlign::Left,
                    &self.settings.heading_color,
                );
                self.push_text_block(lines, true, pending_anchors, blocks);
            }
            LayoutElement::BlockQuote { elements } => {
                for child in elements {
                    self.index_element(
                        child,
                        quote_depth.saturating_add(1),
                        pending_anchors,
                        blocks,
                    );
                }
            }
            LayoutElement::List {
                ordered,
                start,
                items,
            } => {
                for (index, item) in items.iter().enumerate() {
                    let marker = if *ordered {
                        format!("{}. ", start + index as u32)
                    } else {
                        "• ".to_string()
                    };
                    let mut spans = vec![TextSpan::new(&marker)];
                    for child in item {
                        match child {
                            LayoutElement::Paragraph {
                                spans: child_spans, ..
                            }
                            | LayoutElement::Heading {
                                spans: child_spans, ..
                            } => {
                                spans.extend(child_spans.clone());
                            }
                            _ => {
                                let text = child.text_content();
                                if !text.is_empty() {
                                    spans.push(TextSpan::new(&text));
                                }
                            }
                        }
                    }
                    let list_indent = self.settings.font_size * 1.5;
                    let lines = self.shape_lines(
                        &spans,
                        self.settings.font_size,
                        (self.settings.content_width() - list_indent).max(1.0),
                        list_indent,
                        quote_depth,
                        self.settings.text_align,
                        &self.settings.text_color,
                    );
                    self.push_text_block(lines, false, pending_anchors, blocks);
                }
            }
            LayoutElement::Image {
                data,
                alt,
                width,
                height,
                ..
            } => {
                if let Some(data) = data {
                    let (raw_width, raw_height) = image::load_from_memory(data)
                        .map(|image| (image.width() as f32, image.height() as f32))
                        .unwrap_or((
                            width
                                .map(|value| value as f32)
                                .unwrap_or(self.settings.content_width()),
                            height.map(|value| value as f32).unwrap_or(200.0),
                        ));
                    let max_width = self.settings.content_width();
                    let max_height = self.settings.content_height();
                    let scale = (max_width / raw_width)
                        .min(max_height / raw_height)
                        .min(1.0);

                    blocks.push(IndexedBlock {
                        items: vec![IndexedItem::Image {
                            data: data.clone(),
                            width: raw_width * scale,
                            height: raw_height * scale,
                            alt: alt.clone(),
                        }],
                        spacing_after: self.settings.paragraph_spacing,
                        keep_with_next: false,
                        anchors: std::mem::take(pending_anchors),
                    });
                }
            }
            LayoutElement::Figure { content, caption } => {
                self.index_element(content, quote_depth, pending_anchors, blocks);
                if let Some(caption) = caption {
                    let lines = self.shape_lines(
                        caption,
                        self.settings.font_size * 0.85,
                        self.settings.content_width(),
                        0.0,
                        quote_depth,
                        TextAlign::Center,
                        &self.settings.text_color,
                    );
                    self.push_text_block(lines, false, pending_anchors, blocks);
                }
            }
            LayoutElement::HorizontalRule => {
                blocks.push(IndexedBlock {
                    items: vec![IndexedItem::HorizontalRule {
                        height: self.settings.font_size * 2.0,
                    }],
                    spacing_after: 0.0,
                    keep_with_next: false,
                    anchors: std::mem::take(pending_anchors),
                });
            }
            LayoutElement::CodeBlock { code, .. } => {
                let spans = vec![TextSpan::new(code)];
                let lines = self.shape_lines(
                    &spans,
                    self.settings.font_size * 0.9,
                    self.settings.content_width(),
                    0.0,
                    quote_depth,
                    TextAlign::Left,
                    &self.settings.text_color,
                );
                self.push_text_block(lines, false, pending_anchors, blocks);
            }
            LayoutElement::Table { headers, rows } => {
                for row in headers.iter().chain(rows.iter()) {
                    let mut spans = Vec::new();
                    for (cell_index, cell) in row.iter().enumerate() {
                        if cell_index > 0 {
                            spans.push(TextSpan::new("  "));
                        }
                        spans.extend(cell.clone());
                    }
                    let lines = self.shape_lines(
                        &spans,
                        self.settings.font_size,
                        self.settings.content_width(),
                        0.0,
                        quote_depth,
                        TextAlign::Left,
                        &self.settings.text_color,
                    );
                    self.push_text_block(lines, false, pending_anchors, blocks);
                }
            }
            LayoutElement::RawText { text } => {
                let spans = vec![TextSpan::new(text)];
                let lines = self.shape_lines(
                    &spans,
                    self.settings.font_size,
                    self.settings.content_width(),
                    0.0,
                    quote_depth,
                    self.settings.text_align,
                    &self.settings.text_color,
                );
                self.push_text_block(lines, false, pending_anchors, blocks);
            }
        }
    }

    fn push_text_block(
        &self,
        lines: Vec<IndexedLine>,
        keep_with_next: bool,
        pending_anchors: &mut Vec<String>,
        blocks: &mut Vec<IndexedBlock>,
    ) {
        if !lines.is_empty() {
            blocks.push(IndexedBlock {
                items: lines.into_iter().map(IndexedItem::Line).collect(),
                spacing_after: self.settings.paragraph_spacing,
                keep_with_next,
                anchors: std::mem::take(pending_anchors),
            });
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn shape_lines(
        &mut self,
        spans: &[TextSpan],
        font_size: f32,
        width: f32,
        x_offset: f32,
        quote_depth: u8,
        align: TextAlign,
        default_color: &Color,
    ) -> Vec<IndexedLine> {
        let line_height = font_size * self.settings.line_height;
        let metrics = Metrics::new(font_size, line_height);
        let font_family = self
            .font_manager
            .resolve_family(&self.settings.font_family)
            .to_string();
        let styles: Vec<SpanStyle> = spans.iter().map(|span| span.style.clone()).collect();
        let default_attrs = Attrs::new().family(Family::Name(&font_family));
        let rich_spans: Vec<(&str, Attrs<'_>)> = spans
            .iter()
            .enumerate()
            .map(|(index, span)| {
                let attrs = default_attrs
                    .weight(if span.style.bold {
                        Weight::BOLD
                    } else {
                        Weight::NORMAL
                    })
                    .style(if span.style.italic {
                        Style::Italic
                    } else {
                        Style::Normal
                    })
                    .metadata(index);
                (span.text.as_str(), attrs)
            })
            .collect();

        let font_system = self.font_manager.font_system_mut();
        let mut buffer = Buffer::new(font_system, metrics);
        buffer.set_size(font_system, Some(width), None);
        buffer.set_wrap(font_system, Wrap::WordOrGlyph);
        buffer.set_rich_text(font_system, rich_spans, default_attrs, Shaping::Advanced);
        buffer.shape_until_scroll(font_system, false);

        let full_text: String = spans.iter().map(|span| span.text.as_str()).collect();
        let hard_line_offsets = hard_line_offsets(&full_text);
        let available_width = self.settings.content_width();
        let mut lines = Vec::new();

        for run in buffer.layout_runs() {
            let hard_line_start = *hard_line_offsets.get(run.line_i).unwrap_or(&0);
            let source_start = run
                .glyphs
                .iter()
                .map(|glyph| glyph.start)
                .min()
                .unwrap_or(0);
            let source_end = run
                .glyphs
                .iter()
                .map(|glyph| glyph.end)
                .max()
                .unwrap_or(source_start);
            let line_text = run
                .text
                .get(source_start..source_end)
                .unwrap_or("")
                .trim_end_matches(char::is_whitespace)
                .to_string();
            let alignment_offset = match align {
                TextAlign::Right => (width - run.line_w).max(0.0),
                TextAlign::Center => ((width - run.line_w) / 2.0).max(0.0),
                TextAlign::Left | TextAlign::Justify => 0.0,
            };

            let glyphs = run
                .glyphs
                .iter()
                .cloned()
                .map(|glyph| {
                    let style = styles.get(glyph.metadata).cloned().unwrap_or_default();
                    let color = style
                        .color_override
                        .map(|rgba| Color::new(rgba[0], rgba[1], rgba[2], rgba[3]))
                        .unwrap_or_else(|| {
                            if style.link.is_some() {
                                self.settings.link_color
                            } else {
                                *default_color
                            }
                        });
                    IndexedGlyph {
                        source_start: hard_line_start + glyph.start,
                        source_end: hard_line_start + glyph.end,
                        glyph,
                        color,
                        underline: style.underline,
                        strikethrough: style.strikethrough,
                        link: style.link,
                    }
                })
                .collect();

            lines.push(IndexedLine {
                glyphs,
                text: line_text,
                width: run.line_w,
                height: run.line_height,
                baseline_offset: run.line_y - run.line_top,
                x_offset: (x_offset + alignment_offset).min(available_width),
                quote_depth,
            });
        }

        lines
    }

    fn paginate_chapter(
        &self,
        chapter: &ChapterLayoutIndex,
        start_page_index: usize,
    ) -> (Vec<Page>, Vec<AnchorPageMap>) {
        let available_height = self.settings.content_height().max(1.0);
        let mut columns: Vec<Page> = Vec::new();
        let mut anchors = Vec::new();
        let mut current_elements = Vec::new();
        let mut current_y = 0.0;

        for (block_index, block) in chapter.blocks.iter().enumerate() {
            let first_height = block.items.first().map(IndexedItem::height).unwrap_or(0.0);
            let next_height = chapter
                .blocks
                .get(block_index + 1)
                .and_then(|next| next.items.first())
                .map(IndexedItem::height)
                .unwrap_or(0.0);
            let block_height: f32 = block.items.iter().map(IndexedItem::height).sum();

            if block.keep_with_next
                && current_y + block_height + next_height > available_height
                && !current_elements.is_empty()
            {
                push_column(
                    &mut columns,
                    chapter,
                    start_page_index,
                    &mut current_elements,
                    &mut current_y,
                );
            } else if current_y + first_height > available_height && !current_elements.is_empty() {
                push_column(
                    &mut columns,
                    chapter,
                    start_page_index,
                    &mut current_elements,
                    &mut current_y,
                );
            }

            let anchor_column = columns.len();
            for anchor in &block.anchors {
                anchors.push((anchor.clone(), anchor_column));
            }

            for item in &block.items {
                let item_height = item.height();
                if current_y + item_height > available_height && !current_elements.is_empty() {
                    push_column(
                        &mut columns,
                        chapter,
                        start_page_index,
                        &mut current_elements,
                        &mut current_y,
                    );
                }

                current_elements.push(PageElement {
                    item: item.clone(),
                    x_position: match item {
                        IndexedItem::Image { width, .. } => {
                            ((self.settings.content_width() - width) / 2.0).max(0.0)
                        }
                        _ => 0.0,
                    },
                    y_position: current_y,
                    column: 0,
                });
                current_y += item_height;
            }

            current_y = (current_y + block.spacing_after).min(available_height);
        }

        if !current_elements.is_empty() || columns.is_empty() {
            push_column(
                &mut columns,
                chapter,
                start_page_index,
                &mut current_elements,
                &mut current_y,
            );
        }

        if self.settings.columns < 2 {
            let anchor_map = anchors
                .into_iter()
                .map(|(anchor_id, column)| AnchorPageMap {
                    chapter_id: chapter.chapter_id.clone(),
                    anchor_id,
                    page_index: start_page_index + column,
                })
                .collect();
            return (columns, anchor_map);
        }

        let mut pages = Vec::new();
        for pair_start in (0..columns.len()).step_by(2) {
            let mut elements = columns[pair_start].elements.clone();
            if let Some(right) = columns.get(pair_start + 1) {
                elements.extend(right.elements.iter().cloned().map(|mut element| {
                    element.column = 1;
                    element
                }));
            }

            pages.push(Page {
                index: start_page_index + pages.len(),
                chapter_id: chapter.chapter_id.clone(),
                chapter_title: chapter.chapter_title.clone(),
                content_height: columns[pair_start].content_height,
                elements,
            });
        }

        let anchor_map = anchors
            .into_iter()
            .map(|(anchor_id, column)| AnchorPageMap {
                chapter_id: chapter.chapter_id.clone(),
                anchor_id,
                page_index: start_page_index + column / 2,
            })
            .collect();

        (pages, anchor_map)
    }
}

fn push_column(
    columns: &mut Vec<Page>,
    chapter: &ChapterLayoutIndex,
    start_page_index: usize,
    elements: &mut Vec<PageElement>,
    current_y: &mut f32,
) {
    columns.push(Page {
        index: start_page_index + columns.len(),
        chapter_id: chapter.chapter_id.clone(),
        chapter_title: chapter.chapter_title.clone(),
        elements: std::mem::take(elements),
        content_height: *current_y,
    });
    *current_y = 0.0;
}

fn hard_line_offsets(text: &str) -> Vec<usize> {
    let mut offsets = vec![0];
    for (index, character) in text.char_indices() {
        if character == '\n' {
            offsets.push(index + character.len_utf8());
        }
    }
    offsets
}

fn collect_span_anchors(spans: &[TextSpan], anchors: &mut Vec<String>) {
    anchors.extend(spans.iter().filter_map(|span| span.style.anchor.clone()));
}

#[cfg(test)]
mod tests {
    use super::*;

    fn load_test_fonts(font_manager: &mut FontManager) {
        font_manager
            .load_font(
                "Literata",
                include_bytes!("../../../assets/fonts/reading/Literata_18pt-Regular.ttf"),
            )
            .unwrap();
        font_manager
            .load_font(
                "Literata-Bold",
                include_bytes!("../../../assets/fonts/reading/Literata_18pt-Bold.ttf"),
            )
            .unwrap();
        font_manager
            .load_font(
                "Literata-Italic",
                include_bytes!("../../../assets/fonts/reading/Literata_18pt-Italic.ttf"),
            )
            .unwrap();
        font_manager
            .load_font(
                "Literata-BoldItalic",
                include_bytes!("../../../assets/fonts/reading/Literata_18pt-BoldItalic.ttf"),
            )
            .unwrap();
        font_manager
            .load_font(
                "Noto Sans",
                include_bytes!("../../../assets/fonts/reading/NotoSans-Regular.ttf"),
            )
            .unwrap();
    }

    fn test_settings() -> ReaderSettings {
        let mut settings = ReaderSettings::default();
        settings.container_width = 800.0;
        settings.container_height = 600.0;
        settings
    }

    #[test]
    fn test_paginate_empty_document() {
        let mut font_manager = FontManager::new();
        let settings = test_settings();
        let mut paginator = Paginator::new(&settings, &mut font_manager);
        let result = paginator.paginate(&LayoutDocument::new());
        assert_eq!(result.total_pages, 0);
    }

    #[test]
    fn test_search() {
        let line = IndexedLine {
            glyphs: Vec::new(),
            text: "Hello world, this is a test".to_string(),
            width: 100.0,
            height: 20.0,
            baseline_offset: 15.0,
            x_offset: 0.0,
            quote_depth: 0,
        };
        let book = PaginatedBook {
            pages: vec![Page {
                index: 0,
                chapter_id: "ch1".to_string(),
                chapter_title: "Chapter 1".to_string(),
                elements: vec![PageElement {
                    item: IndexedItem::Line(line),
                    x_position: 0.0,
                    y_position: 0.0,
                    column: 0,
                }],
                content_height: 20.0,
            }],
            total_pages: 1,
            chapter_page_map: Vec::new(),
            anchor_page_map: Vec::new(),
        };

        let results = book.search("world");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].page_index, 0);
    }

    #[test]
    fn long_paragraph_is_split_without_loss_or_overflow() {
        let mut font_manager = FontManager::new();
        load_test_fonts(&mut font_manager);
        let mut settings = test_settings();
        settings.container_height = 240.0;
        settings.padding_y = 20.0;
        settings.paragraph_spacing = 8.0;

        let words: Vec<String> = (0..240).map(|index| format!("word{index}")).collect();
        let expected = words.join(" ");
        let document = LayoutDocument {
            chapters: vec![LayoutChapter {
                id: "chapter".to_string(),
                title: "Chapter".to_string(),
                elements: vec![LayoutElement::Paragraph {
                    spans: vec![TextSpan::new(&expected)],
                    indent: false,
                }],
            }],
        };

        let mut paginator = Paginator::new(&settings, &mut font_manager);
        let book = paginator.paginate(&document);
        assert!(book.total_pages > 1);
        for page in &book.pages {
            for element in &page.elements {
                assert!(
                    element.y_position + element.item.height()
                        <= settings.content_height() + f32::EPSILON
                );
            }
        }

        let actual = book
            .pages
            .iter()
            .map(Page::text_content)
            .collect::<Vec<_>>()
            .join(" ");
        assert_eq!(
            actual.split_whitespace().collect::<Vec<_>>(),
            words.iter().map(String::as_str).collect::<Vec<_>>()
        );
    }

    #[test]
    fn chapters_never_share_a_two_column_page() {
        let mut font_manager = FontManager::new();
        load_test_fonts(&mut font_manager);
        let mut settings = test_settings();
        settings.columns = 2;

        let document = LayoutDocument {
            chapters: vec![
                LayoutChapter {
                    id: "one".to_string(),
                    title: "One".to_string(),
                    elements: vec![LayoutElement::Paragraph {
                        spans: vec![TextSpan::new("First chapter")],
                        indent: false,
                    }],
                },
                LayoutChapter {
                    id: "two".to_string(),
                    title: "Two".to_string(),
                    elements: vec![LayoutElement::Paragraph {
                        spans: vec![TextSpan::new("Second chapter")],
                        indent: false,
                    }],
                },
            ],
        };

        let mut paginator = Paginator::new(&settings, &mut font_manager);
        let book = paginator.paginate(&document);
        assert_eq!(book.pages.len(), 2);
        assert_eq!(book.pages[0].chapter_id, "one");
        assert_eq!(book.pages[1].chapter_id, "two");
        assert_eq!(book.chapter_page_map[1].first_page_index, 1);
    }

    #[test]
    fn anchors_resolve_to_the_page_containing_following_content() {
        let mut font_manager = FontManager::new();
        load_test_fonts(&mut font_manager);
        let settings = test_settings();
        let document = LayoutDocument {
            chapters: vec![LayoutChapter {
                id: "chapter".to_string(),
                title: "Chapter".to_string(),
                elements: vec![
                    LayoutElement::Anchor {
                        id: "middle".to_string(),
                    },
                    LayoutElement::Paragraph {
                        spans: vec![TextSpan::new("Anchored text")],
                        indent: false,
                    },
                ],
            }],
        };

        let mut paginator = Paginator::new(&settings, &mut font_manager);
        let book = paginator.paginate(&document);
        assert_eq!(book.anchor_page_map.len(), 1);
        assert_eq!(book.anchor_page_map[0].anchor_id, "middle");
        assert_eq!(book.anchor_page_map[0].page_index, 0);
    }

    #[test]
    fn missing_primary_glyphs_use_the_bundled_fallback() {
        let mut font_manager = FontManager::new();
        load_test_fonts(&mut font_manager);
        let literata_family = font_manager.resolve_family("Literata").to_string();
        let noto_family = font_manager.resolve_family("Noto Sans").to_string();
        let database = font_manager.font_system().db();
        let family_id = |name: &str| {
            database
                .faces()
                .find(|face| face.families.iter().any(|(family, _)| family == name))
                .map(|face| face.id)
                .unwrap()
        };
        let literata_id = family_id(&literata_family);
        let noto_id = family_id(&noto_family);
        let supports = |font_id, character| {
            database
                .with_face_data(font_id, |data, index| {
                    cosmic_text::rustybuzz::Face::from_slice(data, index)
                        .and_then(|face| face.glyph_index(character))
                        .is_some()
                })
                .unwrap_or(false)
        };
        let fallback_character = (0x20..=0xffff)
            .filter_map(char::from_u32)
            .find(|character| supports(noto_id, *character) && !supports(literata_id, *character))
            .expect("test fonts should have a fallback-only glyph");
        let settings = test_settings();
        let document = LayoutDocument {
            chapters: vec![LayoutChapter {
                id: "fallback".to_string(),
                title: "Fallback".to_string(),
                elements: vec![LayoutElement::Paragraph {
                    spans: vec![TextSpan::new(&fallback_character.to_string())],
                    indent: false,
                }],
            }],
        };

        let mut paginator = Paginator::new(&settings, &mut font_manager);
        let book = paginator.paginate(&document);
        drop(paginator);

        let glyph_families: Vec<String> = book.pages[0]
            .elements
            .iter()
            .flat_map(|element| {
                let IndexedItem::Line(line) = &element.item else {
                    return Vec::new();
                };
                line.glyphs
                    .iter()
                    .filter_map(|glyph| {
                        font_manager
                            .font_system()
                            .db()
                            .face(glyph.glyph.font_id)
                            .and_then(|face| face.families.first())
                            .map(|(name, _)| name.clone())
                    })
                    .collect::<Vec<_>>()
            })
            .collect();
        assert!(
            glyph_families.iter().any(|name| name == &noto_family),
            "expected {:?} to use {}, got {:?}",
            fallback_character,
            noto_family,
            glyph_families
        );
    }

    #[test]
    fn styled_runs_use_distinct_static_faces() {
        let mut font_manager = FontManager::new();
        load_test_fonts(&mut font_manager);
        let settings = test_settings();
        let spans = vec![
            TextSpan::new("regular "),
            TextSpan::with_style(
                "bold ",
                SpanStyle {
                    bold: true,
                    ..SpanStyle::default()
                },
            ),
            TextSpan::with_style(
                "italic ",
                SpanStyle {
                    italic: true,
                    ..SpanStyle::default()
                },
            ),
            TextSpan::with_style(
                "bolditalic",
                SpanStyle {
                    bold: true,
                    italic: true,
                    ..SpanStyle::default()
                },
            ),
        ];
        let document = LayoutDocument {
            chapters: vec![LayoutChapter {
                id: "styles".to_string(),
                title: "Styles".to_string(),
                elements: vec![LayoutElement::Paragraph {
                    spans,
                    indent: false,
                }],
            }],
        };

        let mut paginator = Paginator::new(&settings, &mut font_manager);
        let book = paginator.paginate(&document);
        let glyphs = book.pages[0]
            .elements
            .iter()
            .flat_map(|element| match &element.item {
                IndexedItem::Line(line) => line.glyphs.iter().collect::<Vec<_>>(),
                _ => Vec::new(),
            })
            .collect::<Vec<_>>();
        let font_at = |offset| {
            glyphs
                .iter()
                .find(|glyph| glyph.source_start <= offset && glyph.source_end > offset)
                .map(|glyph| glyph.glyph.font_id)
                .expect("styled text should produce glyphs")
        };

        let regular = font_at(0);
        let bold = font_at(8);
        let italic = font_at(13);
        let bold_italic = font_at(20);
        assert_ne!(regular, bold);
        assert_ne!(regular, italic);
        assert_ne!(bold, bold_italic);
        assert_ne!(italic, bold_italic);
    }
}
