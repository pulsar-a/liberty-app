//! Font loading and management

use std::collections::HashMap;
use std::sync::Arc;

use cosmic_text::{Attrs, Buffer, Family, FontSystem, Metrics, Shaping, Style, Weight};
use fontdue::Font as FontdueFont;

use crate::error::ReaderError;

/// Font style variant
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FontStyle {
    Regular,
    Bold,
    Italic,
    BoldItalic,
}

impl FontStyle {
    /// Create FontStyle from bold and italic flags
    #[allow(dead_code)]
    pub fn from_flags(bold: bool, italic: bool) -> Self {
        match (bold, italic) {
            (false, false) => FontStyle::Regular,
            (true, false) => FontStyle::Bold,
            (false, true) => FontStyle::Italic,
            (true, true) => FontStyle::BoldItalic,
        }
    }
}

/// A loaded font family with its variants
#[derive(Clone)]
pub struct FontFamily {
    #[allow(dead_code)]
    pub name: String,
    pub variants: HashMap<FontStyle, Arc<FontdueFont>>,
}

impl FontFamily {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            variants: HashMap::new(),
        }
    }

    pub fn get(&self, style: FontStyle) -> Option<&Arc<FontdueFont>> {
        self.variants.get(&style)
            .or_else(|| {
                // Fallback: try regular if requested style not found
                if style != FontStyle::Regular {
                    self.variants.get(&FontStyle::Regular)
                } else {
                    None
                }
            })
    }
}

/// Manages loaded fonts and provides text shaping
pub struct FontManager {
    /// cosmic-text font system for text shaping
    font_system: FontSystem,
    /// fontdue fonts for rasterization
    fonts: HashMap<String, FontFamily>,
    /// Raw font data (needed for cosmic-text)
    font_data: Vec<Vec<u8>>,
}

impl FontManager {
    pub fn new() -> Self {
        Self {
            font_system: FontSystem::new(),
            fonts: HashMap::new(),
            font_data: Vec::new(),
        }
    }

    /// Load a font from raw data
    /// 
    /// Font names should follow the pattern: "FamilyName" or "FamilyName-Style"
    /// e.g., "Literata", "Literata-Bold", "Literata-Italic", "Literata-BoldItalic"
    pub fn load_font(&mut self, font_name: &str, data: &[u8]) -> Result<(), ReaderError> {
        // Parse font name to extract family and style
        let (family_name, style) = Self::parse_font_name(font_name);

        // Load into fontdue for rasterization
        let fontdue_font = FontdueFont::from_bytes(data, fontdue::FontSettings::default())
            .map_err(|e| ReaderError::FontError(format!("Failed to load font: {}", e)))?;

        // Store font data for cosmic-text
        let data_owned = data.to_vec();
        self.font_data.push(data_owned.clone());
        
        // Load into cosmic-text font system
        self.font_system.db_mut().load_font_data(data_owned);

        // Add to our font registry
        let family = self.fonts
            .entry(family_name.clone())
            .or_insert_with(|| FontFamily::new(&family_name));
        
        family.variants.insert(style, Arc::new(fontdue_font));

        Ok(())
    }

    /// Parse font name into family and style
    fn parse_font_name(name: &str) -> (String, FontStyle) {
        let name_lower = name.to_lowercase();
        
        if name_lower.ends_with("-bolditalic") || name_lower.ends_with("-boldit") {
            let family = name[..name.len() - if name_lower.ends_with("-bolditalic") { 11 } else { 7 }].to_string();
            (family, FontStyle::BoldItalic)
        } else if name_lower.ends_with("-bold") {
            (name[..name.len() - 5].to_string(), FontStyle::Bold)
        } else if name_lower.ends_with("-italic") || name_lower.ends_with("-it") {
            let family = name[..name.len() - if name_lower.ends_with("-italic") { 7 } else { 3 }].to_string();
            (family, FontStyle::Italic)
        } else if name_lower.ends_with("-regular") {
            (name[..name.len() - 8].to_string(), FontStyle::Regular)
        } else {
            (name.to_string(), FontStyle::Regular)
        }
    }

    /// Get a font family by name
    #[allow(dead_code)]
    pub fn get_family(&self, name: &str) -> Option<&FontFamily> {
        self.fonts.get(name)
    }

    /// Get a specific font variant
    pub fn get_font(&self, family_name: &str, style: FontStyle) -> Option<&Arc<FontdueFont>> {
        self.fonts.get(family_name)?.get(style)
    }

    /// Get the cosmic-text font system
    #[allow(dead_code)]
    pub fn font_system(&self) -> &FontSystem {
        &self.font_system
    }

    /// Get mutable reference to font system
    #[allow(dead_code)]
    pub fn font_system_mut(&mut self) -> &mut FontSystem {
        &mut self.font_system
    }

    /// Create a text buffer for shaping
    #[allow(dead_code)]
    pub fn create_buffer(
        &mut self,
        text: &str,
        font_size: f32,
        line_height: f32,
        width: f32,
        family: &str,
        bold: bool,
        italic: bool,
    ) -> Buffer {
        let metrics = Metrics::new(font_size, line_height * font_size);
        let mut buffer = Buffer::new(&mut self.font_system, metrics);

        let weight = if bold { Weight::BOLD } else { Weight::NORMAL };
        let style = if italic { Style::Italic } else { Style::Normal };

        let attrs = Attrs::new()
            .family(Family::Name(family))
            .weight(weight)
            .style(style);

        buffer.set_text(&mut self.font_system, text, attrs, Shaping::Advanced);
        buffer.set_size(&mut self.font_system, Some(width), None);
        buffer.shape_until_scroll(&mut self.font_system, false);

        buffer
    }

    /// Check if a font family is loaded
    #[allow(dead_code)]
    pub fn has_family(&self, name: &str) -> bool {
        self.fonts.contains_key(name)
    }

    /// Get list of loaded font families
    #[allow(dead_code)]
    pub fn list_families(&self) -> Vec<&str> {
        self.fonts.keys().map(|s| s.as_str()).collect()
    }
}

impl Default for FontManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_font_name() {
        assert_eq!(
            FontManager::parse_font_name("Literata"),
            ("Literata".to_string(), FontStyle::Regular)
        );
        assert_eq!(
            FontManager::parse_font_name("Literata-Bold"),
            ("Literata".to_string(), FontStyle::Bold)
        );
        assert_eq!(
            FontManager::parse_font_name("Literata-Italic"),
            ("Literata".to_string(), FontStyle::Italic)
        );
        assert_eq!(
            FontManager::parse_font_name("Literata-BoldItalic"),
            ("Literata".to_string(), FontStyle::BoldItalic)
        );
    }
}

