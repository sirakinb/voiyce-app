# AI Assistant Extension

This directory contains the source code for the Chrome Extension.

## Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right.
3. Click "Load unpacked" and select this `extension/` directory.

## Structure

- `manifest.json`: Extension configuration (Manifest V3).
- `background/`: Service worker for background tasks.
- `content/`: Scripts injected into web pages.
- `popup/`: The UI that appears when clicking the extension icon.
- `shared/`: Utility modules shared across different parts of the extension.

## Notes

- **Microphone Permission**: This extension requires microphone access for AssemblyAI integration. This permission is requested at runtime via `navigator.mediaDevices.getUserMedia` when the recording starts, rather than in `manifest.json`.
- **API Keys**: See `shared/constants.js` to add your AssemblyAI and Gemini API keys.
- **Backend**: Ensure the local backend is running at `http://localhost:3000`.

## Development

The project is currently set up as a raw ES module scaffold. 
- `background/service_worker.js` is loaded as a module.
- `popup/popup.js` is loaded as a module.
- `content/content_script.js` uses dynamic imports to access shared code.

For a production build, consider setting up a bundler (Webpack, Vite, etc.).
