//! Text selection support

use serde::{Deserialize, Serialize};

/// A positioned character for selection tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionedChar {
    /// The character
    pub char: char,
    /// X position in pixels
    pub x: f32,
    /// Y position in pixels (top of line)
    pub y: f32,
    /// Width of the character
    pub width: f32,
    /// Height of the character (line height)
    pub height: f32,
    /// Index in the page text
    pub text_index: usize,
    /// Chapter ID this character belongs to
    pub chapter_id: String,
}

/// Text selection on a page
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TextSelection {
    /// Start position (text index)
    pub start_index: usize,
    /// End position (text index)
    pub end_index: usize,
    /// Selected text content
    pub text: String,
    /// Chapter ID
    pub chapter_id: String,
}

/// Selection state for the current page
#[derive(Debug, Clone, Default)]
pub struct SelectionState {
    /// All positioned characters on the current page
    pub chars: Vec<PositionedChar>,
    /// Current selection (if any)
    pub selection: Option<TextSelection>,
    /// Whether user is currently dragging to select
    pub is_selecting: bool,
    /// Selection start point (mouse down position)
    pub drag_start: Option<(f32, f32)>,
}

impl SelectionState {
    pub fn new() -> Self {
        Self::default()
    }

    /// Clear all character positions
    #[allow(dead_code)]
    pub fn clear(&mut self) {
        self.chars.clear();
        self.selection = None;
        self.is_selecting = false;
        self.drag_start = None;
    }

    /// Add a positioned character
    #[allow(dead_code)]
    pub fn add_char(&mut self, c: PositionedChar) {
        self.chars.push(c);
    }

    /// Find character at a given position
    pub fn char_at_position(&self, x: f32, y: f32) -> Option<&PositionedChar> {
        self.chars.iter().find(|c| {
            x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height
        })
    }

    /// Find the nearest character to a position
    pub fn nearest_char(&self, x: f32, y: f32) -> Option<&PositionedChar> {
        if self.chars.is_empty() {
            return None;
        }

        // Find characters on the same line (within line height tolerance)
        let line_chars: Vec<_> = self.chars.iter()
            .filter(|c| y >= c.y && y < c.y + c.height)
            .collect();

        if line_chars.is_empty() {
            // Find nearest line
            let nearest_line_y = self.chars.iter()
                .map(|c| c.y)
                .min_by(|a, b| {
                    let dist_a = (a - y).abs();
                    let dist_b = (b - y).abs();
                    dist_a.partial_cmp(&dist_b).unwrap()
                })?;

            let line_chars: Vec<_> = self.chars.iter()
                .filter(|c| (c.y - nearest_line_y).abs() < 1.0)
                .collect();

            // Find nearest character on that line
            line_chars.into_iter()
                .min_by(|a, b| {
                    let dist_a = (a.x + a.width / 2.0 - x).abs();
                    let dist_b = (b.x + b.width / 2.0 - x).abs();
                    dist_a.partial_cmp(&dist_b).unwrap()
                })
        } else {
            // Find nearest character on the line
            line_chars.into_iter()
                .min_by(|a, b| {
                    let dist_a = (a.x + a.width / 2.0 - x).abs();
                    let dist_b = (b.x + b.width / 2.0 - x).abs();
                    dist_a.partial_cmp(&dist_b).unwrap()
                })
        }
    }

    /// Start selection at a position
    pub fn start_selection(&mut self, x: f32, y: f32) {
        self.is_selecting = true;
        self.drag_start = Some((x, y));
        self.selection = None;
    }

    /// Update selection during drag
    pub fn update_selection(&mut self, x: f32, y: f32) {
        if !self.is_selecting {
            return;
        }

        let Some((start_x, start_y)) = self.drag_start else {
            return;
        };

        // Find start and end characters
        let start_char = self.nearest_char(start_x, start_y);
        let end_char = self.nearest_char(x, y);

        if let (Some(start), Some(end)) = (start_char, end_char) {
            let (start_idx, end_idx) = if start.text_index <= end.text_index {
                (start.text_index, end.text_index + 1)
            } else {
                (end.text_index, start.text_index + 1)
            };

            // Collect selected text
            let selected_text: String = self.chars.iter()
                .filter(|c| c.text_index >= start_idx && c.text_index < end_idx)
                .map(|c| c.char)
                .collect();

            let chapter_id = start.chapter_id.clone();

            self.selection = Some(TextSelection {
                start_index: start_idx,
                end_index: end_idx,
                text: selected_text,
                chapter_id,
            });
        }
    }

    /// End selection
    pub fn end_selection(&mut self) -> Option<TextSelection> {
        self.is_selecting = false;
        self.drag_start = None;
        self.selection.clone()
    }

    /// Clear selection without ending drag
    pub fn clear_selection(&mut self) {
        self.selection = None;
    }

    /// Get selection rectangles for highlighting
    pub fn get_selection_rects(&self) -> Vec<SelectionRect> {
        let Some(ref selection) = self.selection else {
            return Vec::new();
        };

        let mut rects = Vec::new();
        let mut current_line_y: Option<f32> = None;
        let mut line_start_x: f32 = 0.0;
        let mut line_end_x: f32 = 0.0;
        let mut line_height: f32 = 0.0;

        for c in &self.chars {
            if c.text_index < selection.start_index || c.text_index >= selection.end_index {
                continue;
            }

            match current_line_y {
                None => {
                    // Start new line
                    current_line_y = Some(c.y);
                    line_start_x = c.x;
                    line_end_x = c.x + c.width;
                    line_height = c.height;
                }
                Some(y) if (c.y - y).abs() < 1.0 => {
                    // Same line, extend
                    line_end_x = c.x + c.width;
                }
                Some(y) => {
                    // New line, save previous
                    rects.push(SelectionRect {
                        x: line_start_x,
                        y,
                        width: line_end_x - line_start_x,
                        height: line_height,
                    });

                    // Start new line
                    current_line_y = Some(c.y);
                    line_start_x = c.x;
                    line_end_x = c.x + c.width;
                    line_height = c.height;
                }
            }
        }

        // Add last line
        if let Some(y) = current_line_y {
            rects.push(SelectionRect {
                x: line_start_x,
                y,
                width: line_end_x - line_start_x,
                height: line_height,
            });
        }

        rects
    }
}

/// A rectangle representing a selection highlight
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionRect {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

