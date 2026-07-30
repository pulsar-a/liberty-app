//! Canvas rendering for already-indexed page content.

use std::collections::HashMap;

use cosmic_text::{Color as CosmicColor, SwashCache};

use crate::error::ReaderError;
use crate::fonts::FontManager;
use crate::pagination::{IndexedItem, IndexedLine, Page};
use crate::settings::{Color, ReaderSettings};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct RenderCacheKey {
    layout_generation: u64,
    paint_generation: u64,
    page_index: usize,
    logical_width: u32,
    logical_height: u32,
    pixel_ratio_bits: u32,
}

pub struct Renderer {
    swash_cache: SwashCache,
    page_cache: HashMap<RenderCacheKey, Vec<u8>>,
    max_cache_size: usize,
    layout_generation: u64,
    paint_generation: u64,
}

impl Renderer {
    pub fn new() -> Self {
        Self {
            swash_cache: SwashCache::new(),
            page_cache: HashMap::new(),
            max_cache_size: 5,
            layout_generation: 0,
            paint_generation: 0,
        }
    }

    pub fn update_settings(&mut self, _settings: &ReaderSettings, layout_changed: bool) {
        if layout_changed {
            self.invalidate_layout();
        } else {
            self.invalidate_paint();
        }
    }

    pub fn invalidate_layout(&mut self) {
        self.layout_generation = self.layout_generation.wrapping_add(1);
        self.clear_cache();
    }

    fn invalidate_paint(&mut self) {
        self.paint_generation = self.paint_generation.wrapping_add(1);
        self.clear_cache();
    }

    pub fn set_font_manager(&mut self, _font_manager: &FontManager) {
        self.swash_cache = SwashCache::new();
        self.invalidate_layout();
    }

    pub fn clear_cache(&mut self) {
        self.page_cache.clear();
    }

    pub fn render_page(
        &mut self,
        page: &Page,
        logical_width: u32,
        logical_height: u32,
        pixel_ratio: f32,
        settings: &ReaderSettings,
        font_manager: &mut FontManager,
    ) -> Result<Vec<u8>, ReaderError> {
        let scale = pixel_ratio.max(1.0);
        let pixel_width = ((logical_width as f32) * scale).round().max(1.0) as u32;
        let pixel_height = ((logical_height as f32) * scale).round().max(1.0) as u32;
        let cache_key = RenderCacheKey {
            layout_generation: self.layout_generation,
            paint_generation: self.paint_generation,
            page_index: page.index,
            logical_width,
            logical_height,
            pixel_ratio_bits: scale.to_bits(),
        };

        if let Some(cached) = self.page_cache.get(&cache_key) {
            return Ok(cached.clone());
        }

        let mut pixels = vec![0; (pixel_width * pixel_height * 4) as usize];
        fill_background(
            &mut pixels,
            pixel_width,
            pixel_height,
            &settings.background_color,
        );

        for element in &page.elements {
            let column_x = if element.column == 0 {
                settings.column_1_x()
            } else {
                settings.column_2_x()
            };
            let x = column_x + element.x_position;
            let y = settings.padding_y + element.y_position;

            match &element.item {
                IndexedItem::Line(line) => self.render_line(
                    &mut pixels,
                    pixel_width,
                    pixel_height,
                    line,
                    x,
                    y,
                    scale,
                    settings,
                    font_manager,
                ),
                IndexedItem::Image {
                    data,
                    width,
                    height,
                    ..
                } => render_image(
                    &mut pixels,
                    pixel_width,
                    pixel_height,
                    data,
                    x,
                    y,
                    *width,
                    *height,
                    scale,
                )?,
                IndexedItem::HorizontalRule { height } => {
                    let rule_y = y + height / 2.0;
                    draw_rect(
                        &mut pixels,
                        pixel_width,
                        pixel_height,
                        x * scale,
                        rule_y * scale,
                        settings.content_width() * scale,
                        scale.max(1.0),
                        &Color::rgb(180, 180, 180),
                    );
                }
            }
        }

        if self.page_cache.len() >= self.max_cache_size {
            if let Some(oldest) = self.page_cache.keys().next().copied() {
                self.page_cache.remove(&oldest);
            }
        }
        self.page_cache.insert(cache_key, pixels.clone());
        Ok(pixels)
    }

    #[allow(clippy::too_many_arguments)]
    fn render_line(
        &mut self,
        pixels: &mut [u8],
        pixel_width: u32,
        pixel_height: u32,
        line: &IndexedLine,
        x: f32,
        y: f32,
        scale: f32,
        settings: &ReaderSettings,
        font_manager: &mut FontManager,
    ) {
        let line_x = x + line.x_offset;
        let baseline_y = y + line.baseline_offset;

        if line.quote_depth > 0 {
            let border_x = x + (line.quote_depth.saturating_sub(1) as f32 * settings.font_size);
            draw_rect(
                pixels,
                pixel_width,
                pixel_height,
                border_x * scale,
                y * scale,
                (2.0 * scale).max(1.0),
                line.height * scale,
                &Color::rgb(180, 180, 180),
            );
        }

        for indexed in &line.glyphs {
            let physical = indexed
                .glyph
                .physical((line_x * scale, baseline_y * scale), scale);
            let base_color = CosmicColor::rgba(
                indexed.color.r,
                indexed.color.g,
                indexed.color.b,
                indexed.color.a,
            );

            self.swash_cache.with_pixels(
                font_manager.font_system_mut(),
                physical.cache_key,
                base_color,
                |offset_x, offset_y, color| {
                    let px = physical.x + offset_x;
                    let py = physical.y + offset_y;
                    blend_pixel(pixels, pixel_width, pixel_height, px, py, color.as_rgba());
                },
            );

            if indexed.underline || indexed.strikethrough {
                let decoration_y = if indexed.strikethrough {
                    baseline_y - line.height * 0.3
                } else {
                    baseline_y + line.height * 0.08
                };
                draw_rect(
                    pixels,
                    pixel_width,
                    pixel_height,
                    (line_x + indexed.glyph.x) * scale,
                    decoration_y * scale,
                    indexed.glyph.w.max(1.0) * scale,
                    scale.max(1.0),
                    &indexed.color,
                );
            }
        }
    }
}

impl Default for Renderer {
    fn default() -> Self {
        Self::new()
    }
}

fn fill_background(pixels: &mut [u8], width: u32, height: u32, color: &Color) {
    for pixel in pixels.chunks_exact_mut(4).take((width * height) as usize) {
        pixel.copy_from_slice(&color.to_rgba_array());
    }
}

fn blend_pixel(pixels: &mut [u8], width: u32, height: u32, x: i32, y: i32, foreground: [u8; 4]) {
    if x < 0 || y < 0 || x >= width as i32 || y >= height as i32 {
        return;
    }
    let index = (((y as u32 * width) + x as u32) * 4) as usize;
    let alpha = foreground[3] as f32 / 255.0;
    let inverse = 1.0 - alpha;
    pixels[index] = (foreground[0] as f32 * alpha + pixels[index] as f32 * inverse) as u8;
    pixels[index + 1] = (foreground[1] as f32 * alpha + pixels[index + 1] as f32 * inverse) as u8;
    pixels[index + 2] = (foreground[2] as f32 * alpha + pixels[index + 2] as f32 * inverse) as u8;
    pixels[index + 3] = 255;
}

#[allow(clippy::too_many_arguments)]
fn draw_rect(
    pixels: &mut [u8],
    canvas_width: u32,
    canvas_height: u32,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    color: &Color,
) {
    let start_x = x.floor().max(0.0) as u32;
    let start_y = y.floor().max(0.0) as u32;
    let end_x = (x + width).ceil().max(0.0) as u32;
    let end_y = (y + height).ceil().max(0.0) as u32;

    for py in start_y..end_y.min(canvas_height) {
        for px in start_x..end_x.min(canvas_width) {
            let index = ((py * canvas_width + px) * 4) as usize;
            pixels[index..index + 4].copy_from_slice(&color.to_rgba_array());
        }
    }
}

#[allow(clippy::too_many_arguments)]
fn render_image(
    pixels: &mut [u8],
    canvas_width: u32,
    canvas_height: u32,
    image_data: &[u8],
    x: f32,
    y: f32,
    logical_width: f32,
    logical_height: f32,
    scale: f32,
) -> Result<(), ReaderError> {
    let image = image::load_from_memory(image_data)
        .map_err(|error| ReaderError::ImageError(error.to_string()))?
        .to_rgba8();
    let render_width = (logical_width * scale).round().max(1.0) as u32;
    let render_height = (logical_height * scale).round().max(1.0) as u32;
    let resized = image::imageops::resize(
        &image,
        render_width,
        render_height,
        image::imageops::FilterType::Triangle,
    );
    let start_x = (x * scale).round().max(0.0) as u32;
    let start_y = (y * scale).round().max(0.0) as u32;

    for (offset_x, offset_y, source) in resized.enumerate_pixels() {
        let px = start_x + offset_x;
        let py = start_y + offset_y;
        if px < canvas_width && py < canvas_height {
            blend_pixel(
                pixels,
                canvas_width,
                canvas_height,
                px as i32,
                py as i32,
                [source[0], source[1], source[2], source[3]],
            );
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::layout::{LayoutChapter, LayoutDocument, LayoutElement, TextSpan};
    use crate::pagination::Paginator;

    #[test]
    fn pixel_ratio_changes_only_the_output_resolution() {
        let mut fonts = FontManager::new();
        fonts
            .load_font(
                "Literata",
                include_bytes!("../../../assets/fonts/reading/Literata_18pt-Regular.ttf"),
            )
            .unwrap();
        let mut settings = ReaderSettings::default();
        settings.container_width = 400.0;
        settings.container_height = 300.0;
        let document = LayoutDocument {
            chapters: vec![LayoutChapter {
                id: "one".to_string(),
                title: "One".to_string(),
                elements: vec![LayoutElement::Paragraph {
                    spans: vec![TextSpan::new("A deterministic page")],
                    indent: false,
                }],
            }],
        };
        let mut paginator = Paginator::new(&settings, &mut fonts);
        let book = paginator.paginate(&document);
        drop(paginator);

        let mut renderer = Renderer::new();
        let one_x = renderer
            .render_page(&book.pages[0], 400, 300, 1.0, &settings, &mut fonts)
            .unwrap();
        let two_x = renderer
            .render_page(&book.pages[0], 400, 300, 2.0, &settings, &mut fonts)
            .unwrap();

        assert_eq!(one_x.len(), 400 * 300 * 4);
        assert_eq!(two_x.len(), 800 * 600 * 4);
        assert!(one_x
            .chunks_exact(4)
            .any(|pixel| pixel != settings.background_color.to_rgba_array()));
    }
}
