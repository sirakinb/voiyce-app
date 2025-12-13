# Quick Start Guide

Get the Audio Recorder Extension up and running in 5 minutes!

## Installation

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or: Menu → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to and select the project root directory
   - The extension should now appear in your list

## First Test

### Step 1: Open a Test Page
Navigate to any webpage with a text input, such as:
- `https://google.com` (search box)
- `https://github.com` (any issue/PR comment box)
- Any website with a form

### Step 2: Show the Overlay
1. Click the extension icon in your toolbar
2. Click the "Show Overlay" button
3. The overlay appears in the bottom-right corner

### Step 3: Drag the Overlay
1. Click and hold the header (top bar with 🎙️)
2. Drag it to a different position
3. Release - it will snap to the nearest corner

### Step 4: Start Recording
1. Click the microphone button (🎤)
2. Allow microphone permissions if prompted
3. The button changes to ⏸️ and pulses
4. A waveform canvas appears below
5. Speak into your microphone
6. Watch the waveform visualize your voice

### Step 5: Complete Recording
**To Confirm:**
1. Click the ✓ button
2. Audio is sent to service worker (currently returns mock transcription)
3. Mock text appears in console
4. In production: text would be inserted at cursor or copied to clipboard

**To Cancel:**
1. Click the ✕ button
2. Recording is discarded
3. Overlay resets to initial state

## Testing Text Insertion

1. **Focus an input field** (click inside it)
2. **Start and confirm a recording**
3. **Check the result:**
   - Text should insert at cursor position
   - If no input is focused, text copies to clipboard

### Test Cases

**A. Input Field**
```html
<input type="text" placeholder="Type here...">
```
✅ Text inserts at cursor

**B. Textarea**
```html
<textarea placeholder="Type here..."></textarea>
```
✅ Text inserts at cursor

**C. Content Editable**
```html
<div contenteditable="true">Type here...</div>
```
✅ Text inserts at cursor

**D. No Focus**
- Don't focus any input
- Record and confirm
✅ Text copies to clipboard

## Understanding the Mock Response

Currently, the service worker returns a mock transcription:
```
"This is a mock transcription. TODO: Implement real API integration."
```

This will appear in:
- Console log: `[Content Script] Received transcription: ...`
- Focused input (if any)
- Clipboard (if no focused input)

## Next Steps

### To Add Real Transcription

1. Choose an API (OpenAI Whisper, Google Speech-to-Text, etc.)
2. Get an API key
3. Modify `background/service-worker.js`:
   - Replace mock response with actual API call
   - Handle base64 → blob conversion
   - Send to API endpoint
   - Return real transcription

See `DEVELOPMENT.md` for detailed API integration guide.

### To Customize

**Change Colors:**
Edit `content/content-script.css`:
```css
.audio-recorder-overlay {
  background: linear-gradient(135deg, #YOUR_COLOR_1, #YOUR_COLOR_2);
}
```

**Change Position:**
Edit `positionOverlay()` in `content/content-script.js`:
```javascript
function positionOverlay() {
  // Change to top-left:
  overlayElement.style.left = '20px';
  overlayElement.style.top = '20px';
}
```

**Change Waveform Color:**
Edit in `startWaveformAnimation()`:
```javascript
canvasContext.strokeStyle = '#YOUR_COLOR'; // Default: #4CAF50
```

## Troubleshooting

### Overlay Doesn't Appear
- **Check:** Is the extension enabled?
- **Check:** Are you on an HTTPS page? (required for mic access)
- **Check:** Open DevTools Console - any errors?

### Microphone Permission Denied
- **Fix:** Go to chrome://settings/content/microphone
- **Fix:** Ensure the site has permission
- **Fix:** Try a different test site

### Waveform Not Animating
- **Check:** Is your microphone working in other apps?
- **Check:** Is another app using your microphone?
- **Check:** Console for errors

### Text Not Inserting
- **Check:** Did you focus an input first?
- **Check:** Is the element editable (not disabled/readonly)?
- **Check:** Console logs for insertion errors

### Extension Not Loading
- **Check:** Is `manifest.json` valid JSON?
- **Check:** Are all files in the correct directories?
- **Check:** Chrome Extensions page shows any errors?

## Keyboard Shortcuts (Future)

Currently not implemented, but planned:
- `Ctrl+Shift+R` - Toggle recording
- `Ctrl+Enter` - Confirm recording
- `Escape` - Cancel recording

## Support

For issues or questions:
1. Check `DEVELOPMENT.md` for detailed documentation
2. Check `README.md` for feature overview
3. Check browser console for error messages
4. Review the code comments in `content/content-script.js`

## Demo Video (Create One!)

Consider recording a demo video showing:
1. Loading the extension
2. Showing the overlay
3. Dragging it around
4. Recording audio with waveform
5. Confirming/canceling
6. Text insertion in various inputs

This helps users understand the extension quickly!

---

**Enjoy your audio recording extension! 🎤**
