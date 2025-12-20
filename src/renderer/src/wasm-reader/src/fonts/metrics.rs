//! Font metrics calculation
//!
//! Utility types and functions for font measurement.
//! These will be used for advanced text layout features.

#![allow(dead_code)]

use fontdue::Font;

/// Font metrics for text measurement
#[derive(Debug, Clone, Copy)]
pub struct FontMetrics {
    /// Ascender height (distance from baseline to top)
    pub ascender: f32,
    /// Descender depth (distance from baseline to bottom, typically negative)
    pub descender: f32,
    /// Line gap (additional space between lines)
    pub line_gap: f32,
    /// Units per em
    pub units_per_em: f32,
}

impl FontMetrics {
    /// Calculate metrics from a fontdue Font at a given size
    pub fn from_font(font: &Font, font_size: f32) -> Self {
        let metrics = font.horizontal_line_metrics(font_size).unwrap_or(
            fontdue::LineMetrics {
                ascent: font_size * 0.8,
                descent: font_size * -0.2,
                line_gap: 0.0,
                new_line_size: font_size * 1.2,
            }
        );

        Self {
            ascender: metrics.ascent,
            descender: metrics.descent,
            line_gap: metrics.line_gap,
            units_per_em: font_size,
        }
    }

    /// Get the total line height
    pub fn line_height(&self) -> f32 {
        self.ascender - self.descender + self.line_gap
    }

    /// Get the baseline offset from the top of the line
    pub fn baseline_offset(&self) -> f32 {
        self.ascender
    }

    /// Calculate the height for multiple lines
    pub fn height_for_lines(&self, lines: usize, line_height_multiplier: f32) -> f32 {
        if lines == 0 {
            return 0.0;
        }
        
        let single_line = self.line_height();
        let multiplied_height = single_line * line_height_multiplier;
        
        // First line uses natural height, subsequent lines use multiplied height
        single_line + (lines as f32 - 1.0) * multiplied_height
    }
}

/// Measure text width using a font
pub fn measure_text_width(font: &Font, text: &str, font_size: f32) -> f32 {
    let mut width = 0.0;
    let mut prev_char: Option<char> = None;

    for c in text.chars() {
        let glyph_index = font.lookup_glyph_index(c);
        let metrics = font.metrics_indexed(glyph_index, font_size);
        
        // Add kerning if available
        if let Some(prev) = prev_char {
            if let Some(kerning) = font.horizontal_kern_indexed(
                font.lookup_glyph_index(prev),
                glyph_index,
                font_size,
            ) {
                width += kerning;
            }
        }
        
        width += metrics.advance_width;
        prev_char = Some(c);
    }

    width
}

/// Word break opportunity
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum BreakOpportunity {
    /// No break allowed
    None,
    /// Break allowed (soft break like space)
    Allowed,
    /// Break required (hard break like newline)
    Required,
}

/// Find break opportunities in text
pub fn find_break_opportunities(text: &str) -> Vec<(usize, BreakOpportunity)> {
    let mut opportunities = Vec::new();
    
    for (i, c) in text.char_indices() {
        let opp = match c {
            '\n' | '\r' => BreakOpportunity::Required,
            ' ' | '\t' | '-' => BreakOpportunity::Allowed,
            _ => BreakOpportunity::None,
        };
        
        if opp != BreakOpportunity::None {
            opportunities.push((i, opp));
        }
    }
    
    opportunities
}

