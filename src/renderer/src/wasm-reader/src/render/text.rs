//! Text rendering utilities

use crate::settings::Color;

/// Text renderer for glyph-level rendering
pub struct TextRenderer;

impl TextRenderer {
    pub fn new() -> Self {
        Self
    }

    /// Render a single glyph bitmap to the pixel buffer
    pub fn render_glyph(
        &self,
        pixels: &mut [u8],
        canvas_width: u32,
        canvas_height: u32,
        bitmap: &[u8],
        glyph_width: usize,
        glyph_height: usize,
        x: i32,
        y: i32,
        color: &Color,
        background: &Color,
    ) {
        for gy in 0..glyph_height {
            for gx in 0..glyph_width {
                let px = x + gx as i32;
                let py = y + gy as i32;

                if px < 0 || py < 0 {
                    continue;
                }

                let px = px as u32;
                let py = py as u32;

                if px >= canvas_width || py >= canvas_height {
                    continue;
                }

                let alpha = bitmap[gy * glyph_width + gx];
                if alpha == 0 {
                    continue;
                }

                let idx = ((py * canvas_width + px) * 4) as usize;
                if idx + 3 >= pixels.len() {
                    continue;
                }

                if alpha == 255 {
                    // Fully opaque
                    pixels[idx] = color.r;
                    pixels[idx + 1] = color.g;
                    pixels[idx + 2] = color.b;
                    pixels[idx + 3] = 255;
                } else {
                    // Blend with background
                    let fg_color = Color::new(color.r, color.g, color.b, alpha);
                    let blended = fg_color.blend_over(background);
                    pixels[idx] = blended.r;
                    pixels[idx + 1] = blended.g;
                    pixels[idx + 2] = blended.b;
                    pixels[idx + 3] = blended.a;
                }
            }
        }
    }

    /// Render underline for a text range
    #[allow(dead_code)]
    pub fn render_underline(
        &self,
        pixels: &mut [u8],
        canvas_width: u32,
        canvas_height: u32,
        start_x: i32,
        end_x: i32,
        y: i32,
        thickness: u32,
        color: &Color,
    ) {
        if y < 0 || y as u32 >= canvas_height {
            return;
        }

        let start_x = start_x.max(0) as u32;
        let end_x = (end_x as u32).min(canvas_width);

        for py in (y as u32)..(y as u32 + thickness).min(canvas_height) {
            for px in start_x..end_x {
                let idx = ((py * canvas_width + px) * 4) as usize;
                if idx + 3 < pixels.len() {
                    pixels[idx] = color.r;
                    pixels[idx + 1] = color.g;
                    pixels[idx + 2] = color.b;
                    pixels[idx + 3] = color.a;
                }
            }
        }
    }

    /// Render strikethrough for a text range
    #[allow(dead_code)]
    pub fn render_strikethrough(
        &self,
        pixels: &mut [u8],
        canvas_width: u32,
        canvas_height: u32,
        start_x: i32,
        end_x: i32,
        y: i32,
        thickness: u32,
        color: &Color,
    ) {
        // Strikethrough is similar to underline, just at a different Y position
        self.render_underline(
            pixels,
            canvas_width,
            canvas_height,
            start_x,
            end_x,
            y,
            thickness,
            color,
        );
    }
}

impl Default for TextRenderer {
    fn default() -> Self {
        Self::new()
    }
}

/// Represents a positioned glyph for text selection
#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct PositionedGlyph {
    /// Character this glyph represents
    pub character: char,
    /// X position in pixels
    pub x: f32,
    /// Y position in pixels (baseline)
    pub y: f32,
    /// Width of the glyph
    pub width: f32,
    /// Height of the glyph
    pub height: f32,
    /// Index in the original text
    pub text_index: usize,
}

/// Stores glyph positions for text selection
#[allow(dead_code)]
#[derive(Debug, Clone, Default)]
pub struct GlyphPositions {
    pub glyphs: Vec<PositionedGlyph>,
}

#[allow(dead_code)]
impl GlyphPositions {
    pub fn new() -> Self {
        Self { glyphs: Vec::new() }
    }

    /// Find the glyph at a given position
    pub fn glyph_at_position(&self, x: f32, y: f32) -> Option<&PositionedGlyph> {
        self.glyphs
            .iter()
            .find(|g| x >= g.x && x < g.x + g.width && y >= g.y - g.height && y < g.y)
    }

    /// Get the text indices for a selection rectangle
    pub fn selection_indices(
        &self,
        start_x: f32,
        start_y: f32,
        end_x: f32,
        end_y: f32,
    ) -> (usize, usize) {
        let mut start_idx = usize::MAX;
        let mut end_idx = 0;

        for glyph in &self.glyphs {
            let glyph_center_x = glyph.x + glyph.width / 2.0;
            let glyph_center_y = glyph.y - glyph.height / 2.0;

            // Check if glyph is within selection
            let in_selection = if start_y == end_y {
                // Single line selection
                glyph_center_y >= start_y.min(end_y) - glyph.height
                    && glyph_center_y <= start_y.max(end_y)
                    && glyph_center_x >= start_x.min(end_x)
                    && glyph_center_x <= start_x.max(end_x)
            } else {
                // Multi-line selection
                (glyph_center_y > start_y.min(end_y) && glyph_center_y < start_y.max(end_y))
                    || (glyph_center_y <= start_y.max(end_y)
                        && glyph_center_y >= start_y.max(end_y) - glyph.height
                        && glyph_center_x >= 0.0
                        && glyph_center_x <= end_x.max(start_x))
                    || (glyph_center_y >= start_y.min(end_y)
                        && glyph_center_y <= start_y.min(end_y) + glyph.height
                        && glyph_center_x >= start_x.min(end_x))
            };

            if in_selection {
                start_idx = start_idx.min(glyph.text_index);
                end_idx = end_idx.max(glyph.text_index + 1);
            }
        }

        if start_idx == usize::MAX {
            (0, 0)
        } else {
            (start_idx, end_idx)
        }
    }

    /// Clear all glyph positions
    pub fn clear(&mut self) {
        self.glyphs.clear();
    }
}

