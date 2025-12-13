# Icons Directory

This directory should contain the extension icons in various sizes:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon32.png` - 32x32 pixels (toolbar icon @2x)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Creating Icons

You can create icons using:
- Design tools (Figma, Sketch, Photoshop)
- Icon generators (e.g., realfavicongenerator.net)
- Simple SVG to PNG conversion tools

The icon should represent the audio recording functionality, such as:
- 🎤 Microphone
- 🎙️ Studio microphone
- 🔊 Speaker with waveform
- Custom design combining microphone + waveform

## Temporary Placeholder

For development purposes, you can create simple colored squares:

```bash
# Using ImageMagick (if available)
convert -size 16x16 xc:#667eea icons/icon16.png
convert -size 32x32 xc:#667eea icons/icon32.png
convert -size 48x48 xc:#667eea icons/icon48.png
convert -size 128x128 xc:#667eea icons/icon128.png
```

Or use online tools like:
- https://www.favicon-generator.org/
- https://favicon.io/favicon-generator/
