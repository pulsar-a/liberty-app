# Reading Fonts

This directory contains fonts bundled for the WASM-based reader.

## Required Fonts

The deterministic reader font registry contains:

1. Four static **Literata 18pt** faces: regular, bold, italic, and bold italic.
2. Four static **Noto Sans** faces with the same styles for glyph fallback.

## Download Source

Literata and Noto Sans are open-source fonts available from Google Fonts:
https://fonts.google.com/specimen/Literata
https://fonts.google.com/noto/specimen/Noto+Sans

Or from the official repository:
https://github.com/nickshanks/Literata

## Font License

Literata and Noto Sans are licensed under the SIL Open Font License 1.1.
See: https://scripts.sil.org/OFL

## Adding Custom Fonts

To add additional fonts for reader use:

1. Place the .ttf or .otf file in this directory
2. Update `DEFAULT_READER_FONTS` in `src/renderer/src/types/wasm-reader.types.ts`
3. Use the font family name in reader settings

Font naming convention:
- Regular: `FontName.ttf`
- Bold: `FontName-Bold.ttf`
- Italic: `FontName-Italic.ttf`
- Bold Italic: `FontName-BoldItalic.ttf`

