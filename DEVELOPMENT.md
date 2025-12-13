# Development Guide - Audio Recorder Extension

This guide provides detailed information for developers working on the Audio Recorder extension.

## Quick Start

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the project root directory
5. The extension should now appear in your extensions list

### Testing the Content Script

1. Navigate to any webpage (e.g., `https://google.com`)
2. Click the extension icon to open the popup
3. Click "Show Overlay" button
4. The overlay should appear in the bottom-right corner
5. Test the functionality:
   - Drag the overlay around by clicking the header
   - Click the microphone button to start recording
   - Observe the waveform visualization
   - Click ✓ to confirm or ✕ to cancel

## Architecture Overview

### Content Script (`content/content-script.js`)

The content script is the main component that runs on every webpage. It:

1. **Injects the UI Overlay**
   - Creates a floating overlay with recording controls
   - Positioned using fixed positioning with high z-index
   - Styled to be non-intrusive and visually appealing

2. **Manages Audio Recording**
   - Requests microphone permissions
   - Uses MediaRecorder API to capture audio
   - Uses Web Audio API for real-time analysis
   - Collects audio chunks for later processing

3. **Visualizes Audio**
   - Uses Canvas API to draw waveform
   - Analyzes audio frequency data in real-time
   - Updates at 60fps using requestAnimationFrame

4. **Tracks User Focus**
   - Monitors focusin/focusout events
   - Maintains reference to last focused editable element
   - Supports insertion into various input types

5. **Communicates with Service Worker**
   - Sends audio data via chrome.runtime.sendMessage
   - Receives transcription results
   - Handles errors and timeouts

### Service Worker (`background/service-worker.js`)

The service worker runs in the background and:

1. **Receives Audio Data**
   - Listens for AUDIO_RECORDED messages
   - Receives base64-encoded audio

2. **Processes Audio** (TODO)
   - Should send audio to transcription API
   - Currently returns mock response
   - Needs API key management

3. **Routes Messages**
   - Facilitates communication between components
   - Manages extension lifecycle

### Popup (`popup/`)

Simple UI for user interaction:
- Shows/hides overlay on current tab
- Future: Settings and preferences

## Key Components Deep Dive

### 1. Overlay Creation

```javascript
createOverlay() {
  // Creates DOM structure
  // Attaches to document.body
  // Positions in bottom-right by default
}
```

**DOM Structure:**
```
<div class="audio-recorder-overlay">
  <div class="audio-recorder-header">
    [Drag handle]
  </div>
  <div class="audio-recorder-controls">
    <button id="audio-recorder-mic-btn">🎤</button>
    <canvas id="audio-recorder-waveform"></canvas>
    <button id="audio-recorder-confirm-btn">✓</button>
    <button id="audio-recorder-cancel-btn">✕</button>
  </div>
</div>
```

### 2. Dragging System

The overlay is draggable via the header:

1. **onDragStart**: Captures initial offset when mousedown on header
2. **onDrag**: Updates position on mousemove while dragging
3. **onDragEnd**: Releases drag and triggers auto-docking
4. **dockOverlay**: Snaps to nearest corner with smooth animation

**Bounds Checking:**
- Overlay stays within viewport
- Cannot be dragged off-screen

### 3. Audio Recording Flow

```
User clicks mic button
  ↓
startRecording()
  ↓
Request mic permission (getUserMedia)
  ↓
Initialize MediaRecorder + AudioContext
  ↓
Start recording + waveform animation
  ↓
User clicks ✓ button
  ↓
confirmRecording()
  ↓
Stop recording + collect chunks
  ↓
Convert to base64
  ↓
Send to service worker
  ↓
Service worker processes (TODO: API call)
  ↓
Transcription returned
  ↓
handleTranscriptionResult()
  ↓
Insert at cursor or copy to clipboard
```

### 4. Waveform Visualization

Uses Web Audio API's AnalyserNode:

1. Create AudioContext and AnalyserNode
2. Connect MediaStream source to analyser
3. Set FFT size (frequency bins)
4. In animation loop:
   - Get time-domain audio data
   - Clear canvas
   - Draw waveform line
   - Request next frame

**Performance:**
- Runs at ~60fps
- Uses Uint8Array for efficient data transfer
- Canvas size: 200x60 pixels

### 5. Text Insertion

Three insertion strategies:

**A. Input/Textarea Elements:**
```javascript
element.value = before + text + after;
element.setSelectionRange(newPosition, newPosition);
element.dispatchEvent(new Event('input'));
```

**B. ContentEditable Elements:**
```javascript
const range = selection.getRangeAt(0);
const textNode = document.createTextNode(text);
range.insertNode(textNode);
```

**C. Clipboard Fallback:**
```javascript
navigator.clipboard.writeText(text);
```

## Message Protocol

### Content Script → Service Worker

**AUDIO_RECORDED**
```javascript
{
  type: 'AUDIO_RECORDED',
  payload: {
    audioData: 'base64string...',
    mimeType: 'audio/webm;codecs=opus',
    size: 123456,
    timestamp: 1234567890
  }
}
```

### Service Worker → Content Script

**TRANSCRIPTION_RESULT**
```javascript
{
  type: 'TRANSCRIPTION_RESULT',
  payload: {
    text: 'transcribed text here'
  }
}
```

### Popup → Content Script

**SHOW_OVERLAY**
```javascript
{
  type: 'SHOW_OVERLAY'
}
```

**HIDE_OVERLAY**
```javascript
{
  type: 'HIDE_OVERLAY'
}
```

**START_RECORDING**
```javascript
{
  type: 'START_RECORDING'
}
```

**STOP_RECORDING**
```javascript
{
  type: 'STOP_RECORDING'
}
```

## TODO: API Integration

To wire up a real transcription API:

### 1. Choose an API

**Option A: OpenAI Whisper**
- Endpoint: `https://api.openai.com/v1/audio/transcriptions`
- Requires: API key, audio file
- Supports: Multiple languages, formats

**Option B: Google Cloud Speech-to-Text**
- Endpoint: Various (REST or gRPC)
- Requires: API key, audio data
- Supports: Streaming, multiple languages

**Option C: AssemblyAI**
- Endpoint: `https://api.assemblyai.com/v2/transcript`
- Requires: API key
- Supports: Multiple features, good for voice apps

### 2. Modify Service Worker

```javascript
// In service-worker.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUDIO_RECORDED') {
    const { audioData, mimeType } = message.payload;
    
    // Convert base64 back to blob
    const blob = base64ToBlob(audioData, mimeType);
    
    // Send to API
    transcribeAudio(blob)
      .then(transcription => {
        sendResponse({
          success: true,
          transcription: transcription.text
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    return true; // Keep channel open
  }
});

async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    },
    body: formData
  });
  
  return await response.json();
}
```

### 3. API Key Management

**Option A: Environment Variables (Build Time)**
```javascript
const API_KEY = process.env.OPENAI_API_KEY;
```

**Option B: Chrome Storage (User Provides)**
```javascript
chrome.storage.sync.get(['apiKey'], (result) => {
  const API_KEY = result.apiKey;
});
```

**Option C: Backend Proxy (Most Secure)**
- Deploy a backend service
- Extension calls your backend
- Backend calls API with server-stored keys

### 4. Error Handling

Add proper error handling for:
- Network failures
- API rate limits
- Invalid audio format
- Quota exceeded
- Authentication errors

## Testing Checklist

### Functionality Tests

- [ ] Overlay appears when popup button clicked
- [ ] Overlay is draggable via header
- [ ] Overlay docks to corners when released
- [ ] Mic button requests permissions
- [ ] Recording starts and stops correctly
- [ ] Waveform animates during recording
- [ ] Confirm button sends audio to service worker
- [ ] Cancel button discards recording
- [ ] Text inserts at cursor in input fields
- [ ] Text inserts at cursor in textareas
- [ ] Text inserts at cursor in contenteditable
- [ ] Clipboard fallback works
- [ ] Error notifications appear for permission denials
- [ ] Resources clean up on page unload

### Browser Compatibility Tests

- [ ] Chrome 88+
- [ ] Edge 88+
- [ ] Opera 74+

### Website Compatibility Tests

Test on various websites:
- [ ] Google Search
- [ ] Gmail
- [ ] GitHub (comment boxes)
- [ ] Medium (contenteditable)
- [ ] Twitter
- [ ] Reddit
- [ ] Notion
- [ ] Slack (if web version)

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] High contrast mode supported
- [ ] Reduced motion respected

## Performance Optimization

### Current Performance

- Waveform rendering: ~60fps
- Audio chunk collection: Real-time
- Drag performance: Smooth
- Memory usage: Low (~5-10MB)

### Potential Optimizations

1. **Lazy Loading**: Only inject overlay when needed
2. **Canvas Optimization**: Use OffscreenCanvas for waveform
3. **Audio Compression**: Compress before sending to service worker
4. **Debounce**: Add debounce to drag operations
5. **Memory**: Clear audio chunks immediately after use

## Security Considerations

1. **Microphone Permissions**: Always request, never assume
2. **Content Security Policy**: Ensure inline scripts are safe
3. **Message Validation**: Validate all incoming messages
4. **API Keys**: Never hardcode, use secure storage
5. **Audio Data**: Handle sensitive data appropriately
6. **HTTPS Only**: Only work on HTTPS pages for getUserMedia

## Debugging Tips

### Enable Verbose Logging

All console logs are prefixed with `[Content Script]`. To filter:
1. Open DevTools (F12)
2. Go to Console
3. Use filter: `/\[Content Script\]/`

### Common Issues

**Issue**: Overlay doesn't appear
- Check: Is content script injected? Look for init log
- Check: Are there any console errors?
- Check: Is popup sending message correctly?

**Issue**: Microphone permission denied
- Check: Is page HTTPS? (required for getUserMedia)
- Check: Has user previously denied permission?
- Check: Is microphone available and not in use?

**Issue**: Waveform not animating
- Check: Is AudioContext created successfully?
- Check: Is analyser connected to source?
- Check: Is animation loop running?

**Issue**: Text not inserting
- Check: Is element truly editable?
- Check: Does element have focus?
- Check: Are there any exceptions in insertTextAtCursor?

### DevTools Inspection

**Inspect Content Script Context:**
1. Open DevTools on the page
2. Console tab shows content script logs
3. Sources tab shows content script files

**Inspect Service Worker:**
1. Go to `chrome://extensions/`
2. Click "Service Worker" link under extension
3. DevTools opens for service worker context

**Inspect Popup:**
1. Right-click extension icon
2. Choose "Inspect popup"
3. DevTools opens for popup context

## Code Quality

### Linting (Future)

Consider adding:
- ESLint for JavaScript linting
- Prettier for code formatting
- Stylelint for CSS

### Testing (Future)

Consider adding:
- Jest for unit tests
- Puppeteer for E2E tests
- Chrome Extension testing library

## Deployment

### Building for Production

1. Remove console.log statements (optional)
2. Minify JavaScript and CSS
3. Optimize images/icons
4. Update version in manifest.json
5. Create ZIP file for Chrome Web Store

### Chrome Web Store Submission

1. Create developer account
2. Prepare store listing:
   - Description
   - Screenshots
   - Promotional images
   - Privacy policy
3. Upload ZIP file
4. Submit for review

## Contributing

When contributing:
1. Follow existing code style
2. Add comments for complex logic
3. Test on multiple websites
4. Update documentation
5. Add TODO comments for future work

## License

MIT
