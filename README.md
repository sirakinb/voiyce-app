# Voiyce - Voice Input Extension

A floating voice input assistant for Chrome that records audio, transcribes it (mocked), and inserts it into any webpage.

## Project Structure
- `extension/`: Chrome Extension source code.
- `server/`: Node.js backend for handling audio uploads.

## Setup Instructions

### 1. Start the Backend Server
The extension sends audio to this local server.
1. Open a terminal.
2. Navigate to `server/`:
   ```bash
   cd server
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   It will run on `http://localhost:3000`.

### 2. Load the Extension in Chrome
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked**.
4. Select the `extension/` folder in this project (`voiyce-app/extension`).

### 3. Usage
1. Open any webpage (e.g., https://google.com). note: refresh the page if it was already open.
2. You should see the glassmorphism floating UI at the bottom center.
3. Click the **Mic** button.
   - You might be asked for microphone permission by the browser (top left).
4. Speak into your mic. You will see the waveform react.
5. Click **Stop** (Mock processing takes 1s).
6. The text (mocked) will appear.
7. Click the **Check (✓)** button to insert text into the active input field, or toggle "Copy only" to copy to clipboard.

## Customization
- **Transcription**: Modify `server/server.js` to call OpenAI / Whisper API.
- **Styles**: Edit `extension/styles.css`.
