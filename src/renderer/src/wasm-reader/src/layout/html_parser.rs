//! HTML to LayoutElement parser

use base64::{engine::general_purpose::STANDARD, Engine};
use ego_tree::NodeRef;
use scraper::{ElementRef, Html, Node, Selector};

use super::document::{LayoutElement, SpanStyle, TextSpan};

/// Parse a data URI and extract the binary data
/// Format: data:[<mediatype>][;base64],<data>
fn parse_data_uri(src: &str) -> Option<Vec<u8>> {
    if !src.starts_with("data:") {
        return None;
    }

    // Find the comma that separates metadata from data
    let comma_pos = src.find(',')?;
    let metadata = &src[5..comma_pos]; // Skip "data:"
    let data = &src[comma_pos + 1..];

    // Check if it's base64 encoded
    if metadata.contains(";base64") {
        STANDARD.decode(data).ok()
    } else {
        // URL-encoded data (less common for images)
        None
    }
}

/// Parse HTML content into layout elements
pub fn parse_html_to_elements(html: &str) -> Vec<LayoutElement> {
    let document = Html::parse_fragment(html);
    let mut elements = Vec::new();

    // Recursively collect elements, flattening container elements
    collect_elements_recursive(
        &document.root_element(),
        &SpanStyle::default(),
        &mut elements,
    );

    // Filter out empty elements
    elements.into_iter().filter(|e| !e.is_empty()).collect()
}

/// Recursively collect elements, flattening semantic containers like section/article
fn collect_elements_recursive(
    element: &ElementRef,
    inherited_style: &SpanStyle,
    elements: &mut Vec<LayoutElement>,
) {
    for child in element.children() {
        match child.value() {
            Node::Element(elem) => {
                let tag = elem.name.local.as_ref().to_lowercase();

                // Flatten semantic containers - descend into their children
                if matches!(
                    tag.as_str(),
                    "section" | "article" | "aside" | "main" | "body" | "html"
                ) {
                    if let Some(child_ref) = ElementRef::wrap(child) {
                        collect_elements_recursive(&child_ref, inherited_style, elements);
                    }
                } else if let Some(child_ref) = ElementRef::wrap(child) {
                    // Parse as a regular element
                    if let Some(layout_elem) = parse_element(&child_ref, &tag, inherited_style) {
                        elements.push(layout_elem);
                    }
                }
            }
            Node::Text(text) => {
                let trimmed = text.text.trim();
                if !trimmed.is_empty() {
                    elements.push(LayoutElement::Paragraph {
                        spans: vec![TextSpan::with_style(trimmed, inherited_style.clone())],
                        indent: false,
                    });
                }
            }
            _ => {}
        }
    }
}

fn parse_node(node: &NodeRef<Node>, inherited_style: &SpanStyle) -> Option<LayoutElement> {
    match node.value() {
        Node::Element(element) => {
            let element_ref = ElementRef::wrap(*node)?;
            parse_element(&element_ref, element.name.local.as_ref(), inherited_style)
        }
        Node::Text(text) => {
            let trimmed = text.text.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(LayoutElement::Paragraph {
                    spans: vec![TextSpan::with_style(trimmed, inherited_style.clone())],
                    indent: false,
                })
            }
        }
        _ => None,
    }
}

fn parse_element(
    element: &ElementRef,
    tag_name: &str,
    inherited_style: &SpanStyle,
) -> Option<LayoutElement> {
    let parsed = parse_element_content(element, tag_name, inherited_style);
    let anchor = element
        .value()
        .attr("id")
        .or_else(|| element.value().attr("name"))
        .filter(|id| !id.is_empty());

    match (parsed, anchor) {
        (Some(parsed), Some(id)) => Some(LayoutElement::Container {
            elements: vec![LayoutElement::Anchor { id: id.to_string() }, parsed],
        }),
        (Some(parsed), None) => Some(parsed),
        (None, Some(id)) => Some(LayoutElement::Anchor { id: id.to_string() }),
        (None, None) => None,
    }
}

fn parse_element_content(
    element: &ElementRef,
    tag_name: &str,
    inherited_style: &SpanStyle,
) -> Option<LayoutElement> {
    match tag_name.to_lowercase().as_str() {
        // Divs - may contain block elements like images, so parse children recursively
        "div" => {
            // Check if div contains block-level elements
            let has_block_children = element.children().any(|child| {
                if let Some(el) = ElementRef::wrap(child) {
                    let tag = el.value().name.local.as_ref().to_lowercase();
                    matches!(
                        tag.as_str(),
                        "div"
                            | "p"
                            | "img"
                            | "figure"
                            | "blockquote"
                            | "ul"
                            | "ol"
                            | "table"
                            | "pre"
                            | "hr"
                            | "h1"
                            | "h2"
                            | "h3"
                            | "h4"
                            | "h5"
                            | "h6"
                    )
                } else {
                    false
                }
            });

            if has_block_children {
                // Recursively parse children as separate elements
                let children = parse_children(element, inherited_style);
                if children.is_empty() {
                    None
                } else if children.len() == 1 {
                    // Unwrap single child
                    Some(children.into_iter().next().unwrap())
                } else {
                    Some(LayoutElement::Container { elements: children })
                }
            } else {
                // Treat as paragraph with text content
                let spans = collect_text_spans(element, inherited_style);
                if spans.is_empty() {
                    None
                } else {
                    Some(LayoutElement::Paragraph {
                        spans,
                        indent: false, // divs typically don't indent
                    })
                }
            }
        }

        // Paragraphs
        "p" => {
            let spans = collect_text_spans(element, inherited_style);
            if spans.is_empty() {
                None
            } else {
                Some(LayoutElement::Paragraph {
                    spans,
                    indent: true,
                })
            }
        }

        // Headings
        "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
            let level = tag_name.chars().nth(1)?.to_digit(10)? as u8;
            let spans = collect_text_spans(element, inherited_style);
            if spans.is_empty() {
                None
            } else {
                Some(LayoutElement::Heading { level, spans })
            }
        }

        // Block quotes
        "blockquote" => {
            let elements = parse_children(element, inherited_style);
            if elements.is_empty() {
                None
            } else {
                Some(LayoutElement::BlockQuote { elements })
            }
        }

        // Lists
        "ul" => {
            let items = parse_list_items(element, inherited_style);
            if items.is_empty() {
                None
            } else {
                Some(LayoutElement::List {
                    ordered: false,
                    start: 1,
                    items,
                })
            }
        }

        "ol" => {
            let start = element
                .value()
                .attr("start")
                .and_then(|s| s.parse().ok())
                .unwrap_or(1);
            let items = parse_list_items(element, inherited_style);
            if items.is_empty() {
                None
            } else {
                Some(LayoutElement::List {
                    ordered: true,
                    start,
                    items,
                })
            }
        }

        // Images
        "img" => {
            let src = element.value().attr("src").unwrap_or("").to_string();
            let alt = element.value().attr("alt").unwrap_or("").to_string();
            let width = element.value().attr("width").and_then(|w| w.parse().ok());
            let height = element.value().attr("height").and_then(|h| h.parse().ok());

            // Parse data URI if present to extract binary image data
            let data = parse_data_uri(&src);

            Some(LayoutElement::Image {
                src,
                alt,
                data,
                width,
                height,
            })
        }

        // Figure
        "figure" => {
            let mut content: Option<LayoutElement> = None;
            let mut caption: Option<Vec<TextSpan>> = None;

            for child in element.children() {
                if let Some(child_element) = ElementRef::wrap(child) {
                    let child_tag = child_element.value().name.local.as_ref().to_lowercase();
                    match child_tag.as_str() {
                        "figcaption" => {
                            caption = Some(collect_text_spans(&child_element, inherited_style));
                        }
                        "img" => {
                            content = parse_element(&child_element, "img", inherited_style);
                        }
                        _ => {
                            if content.is_none() {
                                content =
                                    parse_element(&child_element, &child_tag, inherited_style);
                            }
                        }
                    }
                }
            }

            content.map(|c| LayoutElement::Figure {
                content: Box::new(c),
                caption,
            })
        }

        // Horizontal rule
        "hr" => Some(LayoutElement::HorizontalRule),

        // Code blocks
        "pre" => {
            // Look for code element inside
            let code_selector = Selector::parse("code").ok();
            let code_element = code_selector
                .as_ref()
                .and_then(|s| element.select(s).next());

            let (language, code) = if let Some(code_el) = code_element {
                let lang = code_el.value().attr("class").and_then(|c| {
                    c.split_whitespace()
                        .find(|cls| cls.starts_with("language-"))
                        .map(|cls| cls.trim_start_matches("language-").to_string())
                });
                (lang, code_el.text().collect::<String>())
            } else {
                (None, element.text().collect::<String>())
            };

            Some(LayoutElement::CodeBlock { language, code })
        }

        // Tables
        "table" => {
            let mut headers: Vec<Vec<Vec<TextSpan>>> = Vec::new();
            let mut rows: Vec<Vec<Vec<TextSpan>>> = Vec::new();

            // Parse thead
            if let Some(thead_selector) = Selector::parse("thead tr").ok() {
                for row in element.select(&thead_selector) {
                    let mut header_row: Vec<Vec<TextSpan>> = Vec::new();
                    if let Some(th_selector) = Selector::parse("th").ok() {
                        for cell in row.select(&th_selector) {
                            header_row.push(collect_text_spans(&cell, inherited_style));
                        }
                    }
                    if !header_row.is_empty() {
                        headers.push(header_row);
                    }
                }
            }

            // Parse tbody
            if let Some(tbody_selector) = Selector::parse("tbody tr, tr").ok() {
                for row in element.select(&tbody_selector) {
                    // Skip if this is in thead
                    if row.ancestors().any(|a| {
                        ElementRef::wrap(a)
                            .map(|e| e.value().name.local.as_ref() == "thead")
                            .unwrap_or(false)
                    }) {
                        continue;
                    }

                    let mut row_data: Vec<Vec<TextSpan>> = Vec::new();
                    if let Some(td_selector) = Selector::parse("td, th").ok() {
                        for cell in row.select(&td_selector) {
                            row_data.push(collect_text_spans(&cell, inherited_style));
                        }
                    }
                    if !row_data.is_empty() {
                        rows.push(row_data);
                    }
                }
            }

            if headers.is_empty() && rows.is_empty() {
                None
            } else {
                Some(LayoutElement::Table { headers, rows })
            }
        }

        // Inline elements that should be treated as paragraphs when at top level
        "span" | "em" | "i" | "strong" | "b" | "a" | "u" | "s" | "del" | "sup" | "sub"
        | "small" => {
            let spans = collect_text_spans(element, inherited_style);
            if spans.is_empty() {
                None
            } else {
                Some(LayoutElement::Paragraph {
                    spans,
                    indent: false,
                })
            }
        }

        // Section/article containers - handled by collect_elements_recursive
        // to flatten them and extract their children directly
        "section" | "article" | "aside" | "main" | "body" => {
            // These should be flattened by collect_elements_recursive
            // If we get here, just parse children and return as BlockQuote
            let children = parse_children(element, inherited_style);
            if children.len() == 1 {
                Some(children.into_iter().next().unwrap())
            } else if children.is_empty() {
                None
            } else {
                // Flatten: return first element, others would need special handling
                // In practice, these containers are handled by collect_elements_recursive
                Some(LayoutElement::Container { elements: children })
            }
        }

        // Header/footer/nav - skip or treat as regular containers
        "header" | "footer" | "nav" => {
            let children = parse_children(element, inherited_style);
            if children.is_empty() {
                None
            } else if children.len() == 1 {
                Some(children.into_iter().next().unwrap())
            } else {
                Some(LayoutElement::Container { elements: children })
            }
        }

        // Line break - treat as paragraph break
        "br" => None,

        // Skip these elements
        "script" | "style" | "meta" | "link" | "head" | "title" => None,

        // Unknown elements - try to extract text
        _ => {
            let spans = collect_text_spans(element, inherited_style);
            if spans.is_empty() {
                None
            } else {
                Some(LayoutElement::Paragraph {
                    spans,
                    indent: false,
                })
            }
        }
    }
}

/// Collect text spans from an element, handling inline formatting
fn collect_text_spans(element: &ElementRef, inherited_style: &SpanStyle) -> Vec<TextSpan> {
    let mut spans = Vec::new();
    let mut pending_space = false;
    let mut has_content = false;
    collect_text_spans_recursive(
        element,
        inherited_style,
        &mut spans,
        &mut pending_space,
        &mut has_content,
    );

    // Merge adjacent spans with same style
    merge_spans(&mut spans);

    spans
}

fn collect_text_spans_recursive(
    element: &ElementRef,
    inherited_style: &SpanStyle,
    spans: &mut Vec<TextSpan>,
    pending_space: &mut bool,
    has_content: &mut bool,
) {
    for child in element.children() {
        match child.value() {
            Node::Text(text) => {
                push_normalized_text(
                    spans,
                    text.text.as_ref(),
                    inherited_style,
                    pending_space,
                    has_content,
                );
            }
            Node::Element(elem) => {
                if let Some(child_ref) = ElementRef::wrap(child) {
                    let tag = elem.name.local.as_ref().to_lowercase();

                    // Determine style for this element
                    let mut style = inherited_style.clone();
                    if let Some(anchor) = child_ref
                        .value()
                        .attr("id")
                        .or_else(|| child_ref.value().attr("name"))
                        .filter(|id| !id.is_empty())
                    {
                        style.anchor = Some(anchor.to_string());
                    }

                    match tag.as_str() {
                        "b" | "strong" => style.bold = true,
                        "i" | "em" | "cite" => style.italic = true,
                        "u" => style.underline = true,
                        "s" | "del" | "strike" => style.strikethrough = true,
                        "a" => {
                            if let Some(href) = child_ref.value().attr("href") {
                                style.link = Some(href.to_string());
                            }
                        }
                        "sup" | "sub" | "small" => {
                            // Could set font size override here
                        }
                        "br" => {
                            *pending_space = false;
                            spans.push(TextSpan::with_style("\n", inherited_style.clone()));
                            *has_content = true;
                            continue;
                        }
                        _ => {}
                    }

                    if style.anchor.is_some() && child_ref.text().next().is_none() {
                        spans.push(TextSpan::with_style("", style));
                        continue;
                    }

                    collect_text_spans_recursive(
                        &child_ref,
                        &style,
                        spans,
                        pending_space,
                        has_content,
                    );
                }
            }
            _ => {}
        }
    }
}

fn parse_children(element: &ElementRef, inherited_style: &SpanStyle) -> Vec<LayoutElement> {
    let mut elements = Vec::new();

    for child in element.children() {
        if let Some(el) = parse_node(&child, inherited_style) {
            elements.push(el);
        }
    }

    elements.into_iter().filter(|e| !e.is_empty()).collect()
}

fn parse_list_items(element: &ElementRef, inherited_style: &SpanStyle) -> Vec<Vec<LayoutElement>> {
    let mut items = Vec::new();

    if let Some(li_selector) = Selector::parse("li").ok() {
        for li in element.select(&li_selector) {
            // Only process direct children
            if !is_direct_child(element, &li) {
                continue;
            }

            let item_elements = parse_children(&li, inherited_style);
            if !item_elements.is_empty() {
                items.push(item_elements);
            } else {
                // If no block elements, treat as single paragraph
                let spans = collect_text_spans(&li, inherited_style);
                if !spans.is_empty() {
                    items.push(vec![LayoutElement::Paragraph {
                        spans,
                        indent: false,
                    }]);
                }
            }
        }
    }

    items
}

fn is_direct_child(parent: &ElementRef, child: &ElementRef) -> bool {
    child
        .parent()
        .map(|p| p.id() == parent.id())
        .unwrap_or(false)
}

fn push_normalized_text(
    spans: &mut Vec<TextSpan>,
    text: &str,
    style: &SpanStyle,
    pending_space: &mut bool,
    has_content: &mut bool,
) {
    let mut normalized = String::new();

    for c in text.chars() {
        if c != '\u{00A0}' && c.is_whitespace() {
            *pending_space = *has_content;
            continue;
        }

        if *pending_space {
            normalized.push(' ');
            *pending_space = false;
        }
        normalized.push(c);
        *has_content = true;
    }

    if !normalized.is_empty() {
        spans.push(TextSpan::with_style(&normalized, style.clone()));
    }
}

fn merge_spans(spans: &mut Vec<TextSpan>) {
    if spans.len() < 2 {
        return;
    }

    let mut merged = Vec::with_capacity(spans.len());
    let mut current: Option<TextSpan> = None;

    for span in spans.drain(..) {
        match current {
            Some(ref mut curr) if spans_same_style(curr, &span) => {
                curr.text.push_str(&span.text);
            }
            Some(curr) => {
                merged.push(curr);
                current = Some(span);
            }
            None => {
                current = Some(span);
            }
        }
    }

    if let Some(curr) = current {
        merged.push(curr);
    }

    *spans = merged;
}

fn spans_same_style(a: &TextSpan, b: &TextSpan) -> bool {
    a.style.bold == b.style.bold
        && a.style.italic == b.style.italic
        && a.style.underline == b.style.underline
        && a.style.strikethrough == b.style.strikethrough
        && a.style.link == b.style.link
        && a.style.anchor == b.style.anchor
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_paragraph() {
        let elements = parse_html_to_elements("<p>Hello world</p>");
        assert_eq!(elements.len(), 1);

        if let LayoutElement::Paragraph { spans, indent } = &elements[0] {
            assert!(indent);
            assert_eq!(spans.len(), 1);
            assert_eq!(spans[0].text, "Hello world");
        } else {
            panic!("Expected paragraph");
        }
    }

    #[test]
    fn test_parse_heading() {
        let elements = parse_html_to_elements("<h2>Chapter One</h2>");
        assert_eq!(elements.len(), 1);

        if let LayoutElement::Heading { level, spans } = &elements[0] {
            assert_eq!(*level, 2);
            assert_eq!(spans[0].text, "Chapter One");
        } else {
            panic!("Expected heading");
        }
    }

    #[test]
    fn test_parse_formatted_text() {
        let elements =
            parse_html_to_elements("<p>Hello <strong>bold</strong> and <em>italic</em></p>");
        assert_eq!(elements.len(), 1);

        if let LayoutElement::Paragraph { spans, .. } = &elements[0] {
            assert!(spans.len() >= 3);
            // Check that bold text has bold style
            let bold_span = spans.iter().find(|s| s.text.contains("bold")).unwrap();
            assert!(bold_span.style.bold);
            // Check that italic text has italic style
            let italic_span = spans.iter().find(|s| s.text.contains("italic")).unwrap();
            assert!(italic_span.style.italic);
        } else {
            panic!("Expected paragraph");
        }
    }

    #[test]
    fn normalizes_whitespace_across_inline_boundaries() {
        let elements = parse_html_to_elements(
            "<p>\n  Hello <strong>  bold </strong>\n <em>world</em>  !\n</p>",
        );
        let LayoutElement::Paragraph { spans, .. } = &elements[0] else {
            panic!("expected paragraph");
        };
        assert_eq!(
            spans
                .iter()
                .map(|span| span.text.as_str())
                .collect::<String>(),
            "Hello bold world !"
        );
        assert!(spans
            .iter()
            .any(|span| span.style.bold && span.text.contains("bold")));
        assert!(spans
            .iter()
            .any(|span| span.style.italic && span.text.contains("world")));
    }

    #[test]
    fn preserves_nbsp_breaks_and_block_anchors() {
        let elements =
            parse_html_to_elements("<div><p id=\"start\">A\u{00a0}B<br/>C</p><p>Next</p></div>");
        let LayoutElement::Container { elements } = &elements[0] else {
            panic!("ordinary div should be a semantic container");
        };
        let LayoutElement::Container {
            elements: anchored_paragraph,
        } = &elements[0]
        else {
            panic!("anchored paragraph should retain its anchor");
        };
        assert!(matches!(
            &anchored_paragraph[0],
            LayoutElement::Anchor { id } if id == "start"
        ));
        assert_eq!(anchored_paragraph[1].text_content(), "A\u{00a0}B\nC");
        assert_eq!(elements[1].text_content(), "Next");
    }

    #[test]
    fn preserves_empty_inline_anchors() {
        let elements = parse_html_to_elements("<p>Before<a id=\"middle\"></a>After</p>");
        let LayoutElement::Paragraph { spans, .. } = &elements[0] else {
            panic!("expected paragraph");
        };
        assert_eq!(elements[0].text_content(), "BeforeAfter");
        assert!(spans
            .iter()
            .any(|span| span.style.anchor.as_deref() == Some("middle")));
    }

    #[test]
    fn test_parse_list() {
        let elements = parse_html_to_elements("<ul><li>Item 1</li><li>Item 2</li></ul>");
        assert_eq!(elements.len(), 1);

        if let LayoutElement::List { ordered, items, .. } = &elements[0] {
            assert!(!ordered);
            assert_eq!(items.len(), 2);
        } else {
            panic!("Expected list");
        }
    }

    #[test]
    fn preserves_nested_containers_images_figures_and_tables() {
        let elements = parse_html_to_elements(
            r#"
            <section>
              <div><p>Nested text</p></div>
              <figure>
                <img src="cover.png" alt="Cover" width="320" height="480"/>
                <figcaption>A caption</figcaption>
              </figure>
              <table>
                <thead><tr><th>Heading</th></tr></thead>
                <tbody><tr><td>Cell</td></tr></tbody>
              </table>
            </section>
            "#,
        );

        assert_eq!(elements[0].text_content(), "Nested text");
        assert!(!elements
            .iter()
            .any(|element| matches!(element, LayoutElement::BlockQuote { .. })));
        assert!(matches!(
            &elements[1],
            LayoutElement::Figure {
                content,
                caption: Some(_)
            } if matches!(
                content.as_ref(),
                LayoutElement::Image {
                    src,
                    alt,
                    width: Some(320),
                    height: Some(480),
                    ..
                } if src == "cover.png" && alt == "Cover"
            )
        ));
        assert!(matches!(
            &elements[2],
            LayoutElement::Table { headers, rows }
                if headers.len() == 1
                    && rows.len() == 1
                    && headers[0][0][0].text == "Heading"
                    && rows[0][0][0].text == "Cell"
        ));
    }
}
