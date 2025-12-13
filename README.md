# Audio Recorder Extension - Content Script

A Chrome extension content script that provides a floating, draggable audio recording overlay with real-time waveform visualization.

## Features

### 🎤 Audio Recording
- **Web Audio API Integration**: Captures high-quality audio with echo cancellation, noise suppression, and auto gain control
- **MediaRecorder API**: Records audio in the best available format (WebM, OGG, MP4, WAV)
- **Real-time Waveform Visualization**: Displays live audio waveform on a canvas element during recording

### 🎯 UI/UX
- **Floating Overlay**: Non-intrusive UI that stays on top of any webpage
- **Draggable**: Click and drag the header to reposition the overlay anywhere on the screen
- **Auto-Docking**: Automatically snaps to the nearest corner when released for better organization
- **Responsive Design**: Adapts to different screen sizes and respects user accessibility preferences
- **Animated Feedback**: Visual feedback during recording with pulsing animations

### ✏️ Text Insertion
- **Smart Focus Tracking**: Automatically tracks the last focused editable element
- **Cursor Position Insertion**: Inserts transcribed text at the cursor position in:
  - Input fields (`<input>`)
  - Textareas (`<textarea>`)
  - Content-editable elements (`contenteditable`)
- **Clipboard Fallback**: Copies text to clipboard when no editable element is focused
- **Framework Compatibility**: Triggers proper input events for React, Vue, Angular, etc.

### 🔌 Communication
- **Service Worker Integration**: Communicates with the background service worker via `chrome.runtime.sendMessage`
- **Message-Based API**: Supports commands like:
  - `SHOW_OVERLAY` - Display the recording overlay
  - `HIDE_OVERLAY` - Hide the recording overlay
  - `START_RECORDING` - Begin audio recording
  - `STOP_RECORDING` - Stop audio recording
  - `TRANSCRIPTION_RESULT` - Receive transcription from API

### 🛡️ Error Handling
- **Permission Management**: Handles microphone permission denials gracefully
- **Device Detection**: Detects and reports missing or unavailable microphones
- **User Feedback**: Shows clear error messages via toast notifications
- **Resource Cleanup**: Properly cleans up audio streams, contexts, and event listeners

## File Structure

```
content/
├── content-script.js   # Main content script logic
└── content-script.css  # Styling for the overlay UI
```

## Architecture

### State Management
The content script maintains several state variables:
- `overlayElement` - Reference to the DOM overlay
- `isRecording` - Current recording state
- `audioChunks` - Array of recorded audio data
- `lastFocusedElement` - Reference to the last focused editable element
- `mediaRecorder` - MediaRecorder instance
- `audioContext` - Web Audio API context
- `analyser` - Audio analyser for waveform visualization

### Key Functions

#### Overlay Management
- `createOverlay()` - Creates and injects the UI overlay
- `removeOverlay()` - Removes overlay and cleans up resources
- `positionOverlay()` - Sets default position (bottom-right)
- `dockOverlay()` - Snaps overlay to nearest corner

#### Dragging
- `onDragStart()` - Initiates dragging
- `onDrag()` - Updates position during drag
- `onDragEnd()` - Ends dragging and triggers docking

#### Audio Recording
- `startRecording()` - Requests mic access and starts recording
- `stopRecording()` - Stops recording and cleans up audio resources
- `getMimeType()` - Detects best supported audio format
- `startWaveformAnimation()` - Renders live waveform visualization
- `stopWaveformAnimation()` - Stops waveform rendering

#### Workflow Management
- `confirmRecording()` - Sends audio to service worker for processing
- `cancelRecording()` - Discards recording and resets state
- `handleTranscriptionResult()` - Processes transcription from API

#### Text Insertion
- `isEditableElement()` - Checks if element is editable
- `insertTextAtCursor()` - Inserts text at cursor position
- `copyToClipboard()` - Fallback clipboard copy

#### Utilities
- `blobToBase64()` - Converts audio blob to base64 for message passing
- `showNotification()` - Displays toast notifications
- `trackFocusedElement()` - Monitors focus changes
- `handleRecordingError()` - Centralized error handling

## TODOs for API Wiring

### 1. Service Worker Integration
```javascript
// In confirmRecording() function:
// TODO: Replace mock response with actual API call handling
// The service worker should:
// 1. Receive the base64 audio data
// 2. Send it to the transcription API (e.g., OpenAI Whisper, Google Speech-to-Text)
// 3. Return the transcribed text
```

### 2. User Preferences
```javascript
// In init() function:
// TODO: Load user preferences from chrome.storage.sync
// - Auto-show overlay on page load
// - Default output mode (insert vs. clipboard)
// - Preferred overlay position
// - Audio quality settings
```

### 3. Keyboard Shortcuts
```javascript
// TODO: Add keyboard shortcut support
// - Ctrl+Shift+R to toggle recording
// - Ctrl+Enter to confirm
// - Escape to cancel
```

### 4. Advanced Features
```javascript
// TODO: Add support for:
// - Recording pause/resume
// - Real-time transcription streaming
// - Multiple language support
// - Custom hotkey configuration
// - Recording quality presets
```

## Usage

### Basic Usage
The content script is automatically injected into all pages. To use it:

1. Click the extension icon to show the overlay (or send `SHOW_OVERLAY` message)
2. Click the microphone button to start recording
3. Speak into your microphone (waveform shows audio input)
4. Click the check mark (✓) to confirm and process the recording
5. Click the X (✕) to cancel and discard the recording

### Programmatic Control
```javascript
// Show overlay
chrome.tabs.sendMessage(tabId, { type: 'SHOW_OVERLAY' });

// Start recording
chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING' });

// Send transcription result
chrome.tabs.sendMessage(tabId, {
  type: 'TRANSCRIPTION_RESULT',
  payload: { text: 'transcribed text here' }
});
```

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Opera 74+
- ⚠️ Firefox (requires manifest v2 adaptation)
- ❌ Safari (no manifest v3 support yet)

## Permissions Required

- `activeTab` - Access to the current tab
- `clipboardWrite` - Write to clipboard as fallback
- `storage` - Store user preferences (future)
- Host permissions for content script injection

## Accessibility

The overlay includes several accessibility features:
- ARIA labels on all buttons
- Keyboard focus indicators
- Respects `prefers-reduced-motion`
- Respects `prefers-contrast: high`
- Proper focus management

## Known Limitations

1. Cannot insert text into iframes with different origins (CORS)
2. Some rich text editors may require custom handling
3. Waveform visualization performance may vary on low-end devices
4. Maximum recording length determined by available memory

## Development

### Testing
Test the content script on various websites:
- Simple text inputs (Google search, forms)
- Textareas (GitHub comments, forums)
- Content-editable (Medium, WordPress editor)
- Rich text editors (Notion, Slack)

### Debugging
Enable verbose logging:
```javascript
// All console.log statements are prefixed with [Content Script]
// Filter in DevTools console: /\[Content Script\]/
```

## License

MIT
