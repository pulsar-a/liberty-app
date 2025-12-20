# Reading Fonts

This directory contains fonts bundled for the WASM-based reader.

## Required Fonts

Download and place the following Literata font files here:

1. **Literata-Regular.ttf** - Regular weight
2. **Literata-Bold.ttf** - Bold weight
3. **Literata-Italic.ttf** - Italic style
4. **Literata-BoldItalic.ttf** - Bold italic

## Download Source

Literata is an open-source font available from Google Fonts:
https://fonts.google.com/specimen/Literata

Or from the official repository:
https://github.com/nickshanks/Literata

## Font License

Literata is licensed under the SIL Open Font License 1.1.
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

