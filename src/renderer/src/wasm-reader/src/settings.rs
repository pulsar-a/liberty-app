//! Reader settings types

use serde::{Deserialize, Serialize};

/// Text alignment options
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TextAlign {
    Left,
    Right,
    Center,
    Justify,
}

impl Default for TextAlign {
    fn default() -> Self {
        TextAlign::Justify
    }
}

/// RGBA color
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl Color {
    pub const fn new(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self { r, g, b, a }
    }

    pub const fn rgb(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b, a: 255 }
    }

    pub fn to_rgba_array(&self) -> [u8; 4] {
        [self.r, self.g, self.b, self.a]
    }

    /// Blend this color over a background color
    pub fn blend_over(&self, bg: &Color) -> Color {
        if self.a == 255 {
            return *self;
        }
        if self.a == 0 {
            return *bg;
        }

        let alpha = self.a as f32 / 255.0;
        let inv_alpha = 1.0 - alpha;

        Color {
            r: (self.r as f32 * alpha + bg.r as f32 * inv_alpha) as u8,
            g: (self.g as f32 * alpha + bg.g as f32 * inv_alpha) as u8,
            b: (self.b as f32 * alpha + bg.b as f32 * inv_alpha) as u8,
            a: 255,
        }
    }
}

impl Default for Color {
    fn default() -> Self {
        Color::rgb(0, 0, 0)
    }
}

/// Reader settings passed from JavaScript
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReaderSettings {
    // Typography
    pub font_family: String,
    pub font_size: f32,        // pixels
    pub line_height: f32,      // multiplier (1.0 - 2.5)
    pub letter_spacing: f32,   // pixels

    // Layout
    pub padding_x: f32,        // pixels
    pub padding_y: f32,        // pixels
    pub text_align: TextAlign,
    pub paragraph_indent: f32, // pixels
    pub paragraph_spacing: f32, // pixels
    pub max_content_width: f32, // pixels (0 = no limit)
    
    // Column layout
    #[serde(default = "default_columns")]
    pub columns: u8,           // 1 or 2
    #[serde(default = "default_column_gap")]
    pub column_gap: f32,       // pixels

    // Container dimensions (set during paginate)
    #[serde(default)]
    pub container_width: f32,
    #[serde(default)]
    pub container_height: f32,

    // Theme colors
    pub background_color: Color,
    pub text_color: Color,
    pub link_color: Color,
    pub heading_color: Color,

    // Advanced
    pub hyphenation: bool,
}

fn default_columns() -> u8 {
    1
}

fn default_column_gap() -> f32 {
    48.0 // 3rem * 16
}

impl Default for ReaderSettings {
    fn default() -> Self {
        Self {
            // Typography - matching current defaults
            font_family: "Literata".to_string(),
            font_size: 18.0,      // 1.125rem * 16
            line_height: 1.8,
            letter_spacing: 0.0,

            // Layout - matching current defaults
            padding_x: 48.0,      // 3rem * 16
            padding_y: 40.0,      // 2.5rem * 16
            text_align: TextAlign::Justify,
            paragraph_indent: 27.0, // 1.5em * 18px
            paragraph_spacing: 22.5, // 1.25em * 18px
            max_content_width: 672.0, // 42rem * 16
            columns: 1,
            column_gap: 48.0,     // 3rem * 16

            container_width: 0.0,
            container_height: 0.0,

            // Theme - warm theme colors
            background_color: Color::rgb(253, 251, 247), // Warm white
            text_color: Color::rgb(45, 42, 38),          // Dark brown
            link_color: Color::rgb(59, 130, 246),        // Blue
            heading_color: Color::rgb(30, 28, 25),       // Darker brown

            hyphenation: true,
        }
    }
}

impl ReaderSettings {
    /// Get the total available content width (both columns combined if 2-column)
    pub fn total_content_width(&self) -> f32 {
        let available = self.container_width - (self.padding_x * 2.0);
        if self.max_content_width > 0.0 && self.columns == 1 {
            available.min(self.max_content_width)
        } else {
            available
        }
    }

    /// Get the effective content width for a single column
    pub fn content_width(&self) -> f32 {
        let total = self.total_content_width();
        if self.columns >= 2 {
            // In 2-column mode, each column is half the width minus gap
            (total - self.column_gap) / 2.0
        } else {
            total
        }
    }

    /// Get the effective content height considering padding
    pub fn content_height(&self) -> f32 {
        self.container_height - (self.padding_y * 2.0)
    }

    /// Get the actual line height in pixels
    pub fn line_height_px(&self) -> f32 {
        self.font_size * self.line_height
    }

    /// Calculate heading font size for a given level (1-6)
    pub fn heading_size(&self, level: u8) -> f32 {
        let scale = match level {
            1 => 2.0,
            2 => 1.5,
            3 => 1.25,
            4 => 1.0,
            5 => 0.875,
            _ => 0.75,
        };
        self.font_size * scale
    }

    /// Get the X offset for the start of column 1 (left column)
    pub fn column_1_x(&self) -> f32 {
        let total = self.total_content_width();
        let used_width = if self.columns >= 2 {
            total
        } else if self.max_content_width > 0.0 {
            total.min(self.max_content_width)
        } else {
            total
        };
        
        // Center content horizontally
        self.padding_x + (total - used_width) / 2.0
    }

    /// Get the X offset for the start of column 2 (right column)
    pub fn column_2_x(&self) -> f32 {
        if self.columns >= 2 {
            self.column_1_x() + self.content_width() + self.column_gap
        } else {
            self.column_1_x() // Same as column 1 if single column
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_color_blend() {
        let fg = Color::new(255, 0, 0, 128); // Semi-transparent red
        let bg = Color::rgb(0, 0, 255);       // Blue
        let blended = fg.blend_over(&bg);
        
        // Should be purplish
        assert!(blended.r > 100);
        assert!(blended.b > 100);
    }

    #[test]
    fn test_content_width() {
        let mut settings = ReaderSettings::default();
        settings.container_width = 800.0;
        settings.padding_x = 50.0;
        settings.max_content_width = 600.0;

        // Content width should be limited by max_content_width
        assert_eq!(settings.content_width(), 600.0);

        settings.max_content_width = 800.0;
        // Now it should be limited by available space
        assert_eq!(settings.content_width(), 700.0);
    }
}

