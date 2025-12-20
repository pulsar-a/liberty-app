//! Canvas rendering to pixel buffer

use std::collections::HashMap;

use crate::error::ReaderError;
use crate::fonts::{FontManager, FontStyle};
use crate::layout::{LayoutElement, TextSpan};
use crate::pagination::Page;
use crate::settings::{Color, ReaderSettings, TextAlign};

use super::text::TextRenderer;

/// Page cache entry
struct CachedPage {
    pixels: Vec<u8>,
    width: u32,
    height: u32,
}

/// Main renderer for pages
pub struct Renderer {
    text_renderer: TextRenderer,
    page_cache: HashMap<usize, CachedPage>,
    max_cache_size: usize,
}

impl Renderer {
    pub fn new() -> Self {
        Self {
            text_renderer: TextRenderer::new(),
            page_cache: HashMap::new(),
            max_cache_size: 5,
        }
    }

    /// Update renderer with new settings
    pub fn update_settings(&mut self, _settings: &ReaderSettings) {
        // Clear cache when settings change
        self.clear_cache();
    }

    /// Set font manager reference (called when fonts are loaded)
    pub fn set_font_manager(&mut self, _font_manager: &FontManager) {
        // Text renderer will use font manager directly
    }

    /// Clear the page cache
    pub fn clear_cache(&mut self) {
        self.page_cache.clear();
    }

    /// Render a page to a pixel buffer
    pub fn render_page(
        &mut self,
        page: &Page,
        width: u32,
        height: u32,
        settings: &ReaderSettings,
        font_manager: &FontManager,
    ) -> Result<Vec<u8>, ReaderError> {
        // Check cache
        if let Some(cached) = self.page_cache.get(&page.index) {
            if cached.width == width && cached.height == height {
                return Ok(cached.pixels.clone());
            }
        }

        // Create pixel buffer (RGBA)
        let mut pixels = vec![0u8; (width * height * 4) as usize];

        // Fill background
        self.fill_background(&mut pixels, width, height, &settings.background_color);

        // Calculate content area
        let content_y = settings.padding_y;
        let content_width = settings.content_width();
        let content_height = settings.content_height();

        // Column marker threshold (elements with y_position >= this are in column 2)
        let column_marker = content_height + 1.0;

        // Get column X positions
        let column_1_x = settings.column_1_x();
        let column_2_x = settings.column_2_x();

        // Render each element
        for page_element in &page.elements {
            // Determine which column this element belongs to
            let (render_x, actual_y) = if page_element.y_position >= column_marker {
                // Column 2 - subtract the marker offset to get actual Y
                (column_2_x, page_element.y_position - column_marker)
            } else {
                // Column 1
                (column_1_x, page_element.y_position)
            };

            let y = content_y + actual_y;

            self.render_element(
                &mut pixels,
                width,
                height,
                &page_element.element,
                render_x,
                y,
                content_width,
                settings,
                font_manager,
            )?;
        }

        // Cache the result
        if self.page_cache.len() >= self.max_cache_size {
            // Remove oldest entry (simple LRU approximation)
            if let Some(&oldest_key) = self.page_cache.keys().next() {
                self.page_cache.remove(&oldest_key);
            }
        }

        self.page_cache.insert(
            page.index,
            CachedPage {
                pixels: pixels.clone(),
                width,
                height,
            },
        );

        Ok(pixels)
    }

    /// Fill the entire buffer with a background color
    fn fill_background(&self, pixels: &mut [u8], width: u32, height: u32, color: &Color) {
        let rgba = color.to_rgba_array();
        for y in 0..height {
            for x in 0..width {
                let idx = ((y * width + x) * 4) as usize;
                pixels[idx] = rgba[0];
                pixels[idx + 1] = rgba[1];
                pixels[idx + 2] = rgba[2];
                pixels[idx + 3] = rgba[3];
            }
        }
    }

    /// Render a single element
    fn render_element(
        &self,
        pixels: &mut [u8],
        canvas_width: u32,
        canvas_height: u32,
        element: &LayoutElement,
        x: f32,
        y: f32,
        max_width: f32,
        settings: &ReaderSettings,
        font_manager: &FontManager,
    ) -> Result<(), ReaderError> {
        match element {
            LayoutElement::Paragraph { spans, indent } => {
                let indent_x = if *indent { settings.paragraph_indent } else { 0.0 };
                self.render_text_block(
                    pixels,
                    canvas_width,
                    canvas_height,
                    spans,
                    x + indent_x,
                    y,
                    max_width - indent_x,
                    settings.font_size,
                    settings.line_height,
                    &settings.text_color,
                    settings.text_align,
                    settings,
                    font_manager,
                )?;
            }

            LayoutElement::Heading { level, spans } => {
                let font_size = settings.heading_size(*level);
                // Headings are typically left-aligned or centered
                self.render_text_block(
                    pixels,
                    canvas_width,
                    canvas_height,
                    spans,
                    x,
                    y,
                    max_width,
                    font_size,
                    settings.line_height * 0.9, // Tighter line height for headings
                    &settings.heading_color,
                    TextAlign::Left,
                    settings,
                    font_manager,
                )?;
            }

            LayoutElement::BlockQuote { elements } => {
                // Draw left border
                let border_x = x as i32;
                let border_width = 3;
                let quote_padding = settings.font_size;

                // Render quote border
                for py in (y as u32)..(y as u32 + 100).min(canvas_height) {
                    for px in (border_x as u32)..(border_x as u32 + border_width).min(canvas_width) {
                        let idx = ((py * canvas_width + px) * 4) as usize;
                        if idx + 3 < pixels.len() {
                            // Use a muted color for the border
                            let border_color = Color::rgb(180, 180, 180);
                            pixels[idx] = border_color.r;
                            pixels[idx + 1] = border_color.g;
                            pixels[idx + 2] = border_color.b;
                            pixels[idx + 3] = border_color.a;
                        }
                    }
                }

                // Render quote content
                let mut current_y = y;
                for el in elements {
                    self.render_element(
                        pixels,
                        canvas_width,
                        canvas_height,
                        el,
                        x + quote_padding,
                        current_y,
                        max_width - quote_padding * 2.0,
                        settings,
                        font_manager,
                    )?;
                    current_y += settings.line_height_px();
                }
            }

            LayoutElement::List { ordered, start, items } => {
                let mut current_y = y;
                let bullet_width = settings.font_size * 1.5;

                for (i, item) in items.iter().enumerate() {
                    // Draw bullet or number
                    let marker = if *ordered {
                        format!("{}.", start + i as u32)
                    } else {
                        "•".to_string()
                    };

                    self.render_text_block(
                        pixels,
                        canvas_width,
                        canvas_height,
                        &[TextSpan::new(&marker)],
                        x,
                        current_y,
                        bullet_width,
                        settings.font_size,
                        settings.line_height,
                        &settings.text_color,
                        TextAlign::Right,
                        settings,
                        font_manager,
                    )?;

                    // Render item content
                    for el in item {
                        self.render_element(
                            pixels,
                            canvas_width,
                            canvas_height,
                            el,
                            x + bullet_width + settings.font_size * 0.5,
                            current_y,
                            max_width - bullet_width - settings.font_size * 0.5,
                            settings,
                            font_manager,
                        )?;
                    }

                    current_y += settings.line_height_px();
                }
            }

            LayoutElement::HorizontalRule => {
                let rule_y = (y + settings.font_size) as u32;
                let rule_start = x as u32;
                let rule_end = (x + max_width) as u32;

                if rule_y < canvas_height {
                    for px in rule_start..rule_end.min(canvas_width) {
                        let idx = ((rule_y * canvas_width + px) * 4) as usize;
                        if idx + 3 < pixels.len() {
                            let rule_color = Color::rgb(200, 200, 200);
                            pixels[idx] = rule_color.r;
                            pixels[idx + 1] = rule_color.g;
                            pixels[idx + 2] = rule_color.b;
                            pixels[idx + 3] = rule_color.a;
                        }
                    }
                }
            }

            LayoutElement::Image { data, .. } => {
                // Decode and render image if data is available
                if let Some(image_data) = data {
                    // Calculate max height as remaining space on page (accounting for bottom padding)
                    // content_bottom is the y-coordinate where content area ends
                    let content_bottom = canvas_height as f32 - settings.padding_y;
                    // max_height is space from current y position to content bottom
                    let max_height = (content_bottom - y).max(1.0) as u32;
                    
                    self.render_image(
                        pixels,
                        canvas_width,
                        canvas_height,
                        image_data,
                        x as u32,
                        y as u32,
                        max_width as u32,
                        max_height,
                    )?;
                }
            }

            LayoutElement::CodeBlock { code, .. } => {
                // Render code with monospace style (using regular font for now)
                let code_font_size = settings.font_size * 0.9;
                let bg_color = Color::rgb(245, 245, 245);

                // Draw code background
                let bg_height = (code.lines().count() as f32 * code_font_size * 1.4) as u32;
                for py in (y as u32)..(y as u32 + bg_height).min(canvas_height) {
                    for px in (x as u32)..(x as u32 + max_width as u32).min(canvas_width) {
                        let idx = ((py * canvas_width + px) * 4) as usize;
                        if idx + 3 < pixels.len() {
                            pixels[idx] = bg_color.r;
                            pixels[idx + 1] = bg_color.g;
                            pixels[idx + 2] = bg_color.b;
                            pixels[idx + 3] = bg_color.a;
                        }
                    }
                }

                // Render code text
                let code_spans: Vec<TextSpan> = code
                    .lines()
                    .map(|line| TextSpan::new(line))
                    .collect();

                self.render_text_block(
                    pixels,
                    canvas_width,
                    canvas_height,
                    &code_spans,
                    x + settings.font_size * 0.5,
                    y + settings.font_size * 0.25,
                    max_width - settings.font_size,
                    code_font_size,
                    1.4,
                    &Color::rgb(50, 50, 50),
                    TextAlign::Left,
                    settings,
                    font_manager,
                )?;
            }

            LayoutElement::Figure { content, caption } => {
                // Render the main content
                self.render_element(
                    pixels,
                    canvas_width,
                    canvas_height,
                    content,
                    x,
                    y,
                    max_width,
                    settings,
                    font_manager,
                )?;

                // Render caption if present
                if let Some(cap_spans) = caption {
                    let caption_y = y + settings.font_size * 2.0; // Below content
                    self.render_text_block(
                        pixels,
                        canvas_width,
                        canvas_height,
                        cap_spans,
                        x,
                        caption_y,
                        max_width,
                        settings.font_size * 0.85,
                        settings.line_height,
                        &Color::rgb(100, 100, 100),
                        TextAlign::Center,
                        settings,
                        font_manager,
                    )?;
                }
            }

            LayoutElement::Table { headers, rows } => {
                let row_height = settings.line_height_px() * 1.5;
                let mut current_y = y;

                // Render headers
                for header_row in headers {
                    let cell_width = max_width / header_row.len().max(1) as f32;
                    for (i, cell_spans) in header_row.iter().enumerate() {
                        let cell_x = x + (i as f32 * cell_width);
                        self.render_text_block(
                            pixels,
                            canvas_width,
                            canvas_height,
                            cell_spans,
                            cell_x,
                            current_y,
                            cell_width,
                            settings.font_size,
                            settings.line_height,
                            &settings.heading_color,
                            TextAlign::Left,
                            settings,
                            font_manager,
                        )?;
                    }
                    current_y += row_height;
                }

                // Render rows
                for data_row in rows {
                    let cell_width = max_width / data_row.len().max(1) as f32;
                    for (i, cell_spans) in data_row.iter().enumerate() {
                        let cell_x = x + (i as f32 * cell_width);
                        self.render_text_block(
                            pixels,
                            canvas_width,
                            canvas_height,
                            cell_spans,
                            cell_x,
                            current_y,
                            cell_width,
                            settings.font_size,
                            settings.line_height,
                            &settings.text_color,
                            TextAlign::Left,
                            settings,
                            font_manager,
                        )?;
                    }
                    current_y += row_height;
                }
            }

            LayoutElement::RawText { text } => {
                self.render_text_block(
                    pixels,
                    canvas_width,
                    canvas_height,
                    &[TextSpan::new(text)],
                    x,
                    y,
                    max_width,
                    settings.font_size,
                    settings.line_height,
                    &settings.text_color,
                    settings.text_align,
                    settings,
                    font_manager,
                )?;
            }
        }

        Ok(())
    }

    /// Render a block of styled text
    fn render_text_block(
        &self,
        pixels: &mut [u8],
        canvas_width: u32,
        canvas_height: u32,
        spans: &[TextSpan],
        x: f32,
        y: f32,
        max_width: f32,
        font_size: f32,
        line_height: f32,
        default_color: &Color,
        _text_align: TextAlign,
        settings: &ReaderSettings,
        font_manager: &FontManager,
    ) -> Result<(), ReaderError> {
        // Get the font for rendering
        let font = font_manager
            .get_font(&settings.font_family, FontStyle::Regular)
            .ok_or_else(|| ReaderError::FontError("No font loaded".to_string()))?;

        let bold_font = font_manager.get_font(&settings.font_family, FontStyle::Bold);
        let italic_font = font_manager.get_font(&settings.font_family, FontStyle::Italic);

        let mut current_x = x;
        let mut current_y = y;
        let line_height_px = font_size * line_height;

        for span in spans {
            // Choose font based on style
            let render_font = match (span.style.bold, span.style.italic) {
                (true, _) => bold_font.unwrap_or(font),
                (_, true) => italic_font.unwrap_or(font),
                _ => font,
            };

            // Choose color
            let color = if span.style.link.is_some() {
                &settings.link_color
            } else {
                default_color
            };

            // Render each character
            for c in span.text.chars() {
                if c == '\n' {
                    current_x = x;
                    current_y += line_height_px;
                    continue;
                }

                // Get glyph metrics
                let (metrics, bitmap) = render_font.rasterize(c, font_size);

                // Check for line wrap
                if current_x + metrics.advance_width > x + max_width {
                    current_x = x;
                    current_y += line_height_px;
                }

                // Calculate glyph position
                let glyph_x = current_x as i32 + metrics.xmin;
                let glyph_y = current_y as i32 + (font_size * 0.8) as i32 - metrics.ymin - metrics.height as i32;

                // Render glyph
                self.text_renderer.render_glyph(
                    pixels,
                    canvas_width,
                    canvas_height,
                    &bitmap,
                    metrics.width,
                    metrics.height,
                    glyph_x,
                    glyph_y,
                    color,
                    &settings.background_color,
                );

                current_x += metrics.advance_width;
            }
        }

        Ok(())
    }

    /// Render an image from data
    fn render_image(
        &self,
        pixels: &mut [u8],
        canvas_width: u32,
        canvas_height: u32,
        image_data: &[u8],
        x: u32,
        y: u32,
        max_width: u32,
        max_height: u32,
    ) -> Result<(), ReaderError> {
        // Try to decode the image
        let img = image::load_from_memory(image_data)
            .map_err(|e| ReaderError::ImageError(e.to_string()))?;

        let rgba = img.to_rgba8();
        let (img_width, img_height) = rgba.dimensions();

        // Scale to fit both width AND height constraints while maintaining aspect ratio
        let scale_for_width = if img_width > max_width {
            max_width as f32 / img_width as f32
        } else {
            1.0
        };
        
        let scale_for_height = if img_height > max_height {
            max_height as f32 / img_height as f32
        } else {
            1.0
        };
        
        // Use the smaller scale to ensure image fits both constraints
        let scale = scale_for_width.min(scale_for_height);

        let render_width = (img_width as f32 * scale) as u32;
        let render_height = (img_height as f32 * scale) as u32;

        // Center image horizontally
        let offset_x = (max_width - render_width) / 2;

        // Copy pixels
        for py in 0..render_height.min(canvas_height - y) {
            for px in 0..render_width.min(canvas_width - x - offset_x) {
                let src_x = (px as f32 / scale) as u32;
                let src_y = (py as f32 / scale) as u32;

                if src_x < img_width && src_y < img_height {
                    let src_pixel = rgba.get_pixel(src_x, src_y);
                    let dst_x = x + offset_x + px;
                    let dst_y = y + py;

                    if dst_x < canvas_width && dst_y < canvas_height {
                        let idx = ((dst_y * canvas_width + dst_x) * 4) as usize;
                        if idx + 3 < pixels.len() {
                            pixels[idx] = src_pixel[0];
                            pixels[idx + 1] = src_pixel[1];
                            pixels[idx + 2] = src_pixel[2];
                            pixels[idx + 3] = src_pixel[3];
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

impl Default for Renderer {
    fn default() -> Self {
        Self::new()
    }
}

