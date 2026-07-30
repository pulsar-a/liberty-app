//! Font loading and management

use std::collections::{HashMap, HashSet};

use cosmic_text::{Attrs, Buffer, Family, FontSystem, Metrics, Shaping, Style, Weight};

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

/// Manages loaded fonts and provides text shaping
pub struct FontManager {
    /// cosmic-text font system for text shaping
    font_system: FontSystem,
    /// Explicit registry used to prevent duplicate font registration.
    loaded_fonts: HashSet<(String, FontStyle)>,
    family_aliases: HashMap<String, String>,
}

impl FontManager {
    pub fn new() -> Self {
        let mut database = cosmic_text::fontdb::Database::new();
        database.set_serif_family("Noto Sans");
        database.set_sans_serif_family("Noto Sans");
        Self {
            // Do not load host system fonts: pagination must be identical on every OS.
            font_system: FontSystem::new_with_locale_and_db("en-US".to_string(), database),
            loaded_fonts: HashSet::new(),
            family_aliases: HashMap::new(),
        }
    }

    /// Load a font from raw data
    ///
    /// Font names should follow the pattern: "FamilyName" or "FamilyName-Style"
    /// e.g., "Literata", "Literata-Bold", "Literata-Italic", "Literata-BoldItalic"
    pub fn load_font(&mut self, font_name: &str, data: &[u8]) -> Result<(), ReaderError> {
        // Parse font name to extract family and style
        let (family_name, style) = Self::parse_font_name(font_name);
        if self.loaded_fonts.contains(&(family_name.clone(), style)) {
            return Ok(());
        }

        let data_owned = data.to_vec();
        let face_count_before = self.font_system.db().faces().count();
        self.font_system.db_mut().load_font_data(data_owned);
        if self.font_system.db().faces().count() == face_count_before {
            return Err(ReaderError::FontError(format!(
                "Failed to parse font data for {font_name}"
            )));
        }
        let actual_family = self
            .font_system
            .db()
            .faces()
            .nth(face_count_before)
            .and_then(|face| face.families.first())
            .map(|(name, _)| name.clone())
            .ok_or_else(|| {
                ReaderError::FontError(format!("Font {font_name} has no named family"))
            })?;
        self.family_aliases
            .entry(family_name.clone())
            .or_insert_with(|| actual_family.clone());

        if family_name == "Noto Sans" {
            self.font_system
                .db_mut()
                .set_sans_serif_family(actual_family.clone());
            self.font_system.db_mut().set_serif_family(actual_family);
        }

        self.loaded_fonts.insert((family_name, style));

        Ok(())
    }

    /// Parse font name into family and style
    fn parse_font_name(name: &str) -> (String, FontStyle) {
        let name_lower = name.to_lowercase();

        if name_lower.ends_with("-bolditalic") || name_lower.ends_with("-boldit") {
            let family = name[..name.len()
                - if name_lower.ends_with("-bolditalic") {
                    11
                } else {
                    7
                }]
                .to_string();
            (family, FontStyle::BoldItalic)
        } else if name_lower.ends_with("-bold") {
            (name[..name.len() - 5].to_string(), FontStyle::Bold)
        } else if name_lower.ends_with("-italic") || name_lower.ends_with("-it") {
            let family = name[..name.len()
                - if name_lower.ends_with("-italic") {
                    7
                } else {
                    3
                }]
                .to_string();
            (family, FontStyle::Italic)
        } else if name_lower.ends_with("-regular") {
            (name[..name.len() - 8].to_string(), FontStyle::Regular)
        } else {
            (name.to_string(), FontStyle::Regular)
        }
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

    pub fn resolve_family<'a>(&'a self, configured_name: &'a str) -> &'a str {
        self.family_aliases
            .get(configured_name)
            .map(String::as_str)
            .unwrap_or(configured_name)
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
        self.loaded_fonts.iter().any(|(family, _)| family == name)
    }

    /// Get list of loaded font families
    #[allow(dead_code)]
    pub fn list_families(&self) -> Vec<&str> {
        let mut families: Vec<&str> = self
            .loaded_fonts
            .iter()
            .map(|(family, _)| family.as_str())
            .collect();
        families.sort_unstable();
        families.dedup();
        families
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

    #[test]
    fn rejects_invalid_font_data() {
        let mut manager = FontManager::new();
        assert!(manager.load_font("Broken", b"not a font").is_err());
        assert!(!manager.has_family("Broken"));
    }
}
