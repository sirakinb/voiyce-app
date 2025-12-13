/**
 * Content Script - Audio Recording Overlay
 * 
 * This script injects a floating, draggable UI overlay for audio recording
 * with real-time waveform visualization. It uses Web Audio API and MediaRecorder
 * to capture audio, then communicates with the service worker to process recordings.
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let overlayElement = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastFocusedElement = null;

// Audio recording state
let mediaRecorder = null;
let audioStream = null;
let audioContext = null;
let analyser = null;
let animationFrameId = null;
let audioChunks = [];
let isRecording = false;

// ============================================================================
// OVERLAY UI CREATION
// ============================================================================

/**
 * Creates and injects the floating overlay UI into the page
 */
function createOverlay() {
  // Prevent duplicate overlays
  if (overlayElement) {
    return;
  }

  // Create main overlay container
  overlayElement = document.createElement('div');
  overlayElement.id = 'audio-recorder-overlay';
  overlayElement.className = 'audio-recorder-overlay';
  
  // Create overlay header (for dragging)
  const header = document.createElement('div');
  header.className = 'audio-recorder-header';
  header.innerHTML = '<span class="audio-recorder-title">🎙️ Voice Recorder</span>';
  
  // Create controls container
  const controls = document.createElement('div');
  controls.className = 'audio-recorder-controls';
  
  // Create mic toggle button with waveform canvas
  const micButton = document.createElement('button');
  micButton.id = 'audio-recorder-mic-btn';
  micButton.className = 'audio-recorder-btn audio-recorder-mic-btn';
  micButton.setAttribute('aria-label', 'Toggle recording');
  micButton.innerHTML = '<span class="mic-icon">🎤</span>';
  
  // Create waveform canvas
  const waveformCanvas = document.createElement('canvas');
  waveformCanvas.id = 'audio-recorder-waveform';
  waveformCanvas.className = 'audio-recorder-waveform';
  waveformCanvas.width = 200;
  waveformCanvas.height = 60;
  
  // Create confirm button
  const confirmButton = document.createElement('button');
  confirmButton.id = 'audio-recorder-confirm-btn';
  confirmButton.className = 'audio-recorder-btn audio-recorder-confirm-btn';
  confirmButton.setAttribute('aria-label', 'Confirm recording');
  confirmButton.innerHTML = '✓';
  confirmButton.disabled = true;
  
  // Create cancel button
  const cancelButton = document.createElement('button');
  cancelButton.id = 'audio-recorder-cancel-btn';
  cancelButton.className = 'audio-recorder-btn audio-recorder-cancel-btn';
  cancelButton.setAttribute('aria-label', 'Cancel recording');
  cancelButton.innerHTML = '✕';
  
  // Assemble the overlay
  controls.appendChild(micButton);
  controls.appendChild(waveformCanvas);
  controls.appendChild(confirmButton);
  controls.appendChild(cancelButton);
  
  overlayElement.appendChild(header);
  overlayElement.appendChild(controls);
  
  // Add to document body
  document.body.appendChild(overlayElement);
  
  // Attach event listeners
  attachOverlayListeners();
  
  // Position the overlay (default to bottom-right)
  positionOverlay();
}

/**
 * Positions the overlay at a default location (bottom-right corner)
 */
function positionOverlay() {
  if (!overlayElement) return;
  
  const padding = 20;
  overlayElement.style.right = `${padding}px`;
  overlayElement.style.bottom = `${padding}px`;
  overlayElement.style.left = 'auto';
  overlayElement.style.top = 'auto';
}

/**
 * Removes the overlay from the DOM and cleans up resources
 */
function removeOverlay() {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  
  // Clean up any active recording
  if (isRecording) {
    stopRecording(false);
  }
}

// ============================================================================
// DRAGGABLE FUNCTIONALITY
// ============================================================================

/**
 * Attaches all event listeners for the overlay
 */
function attachOverlayListeners() {
  const header = overlayElement.querySelector('.audio-recorder-header');
  const micBtn = document.getElementById('audio-recorder-mic-btn');
  const confirmBtn = document.getElementById('audio-recorder-confirm-btn');
  const cancelBtn = document.getElementById('audio-recorder-cancel-btn');
  
  // Dragging functionality
  header.addEventListener('mousedown', onDragStart);
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', onDragEnd);
  
  // Button functionality
  micBtn.addEventListener('click', toggleRecording);
  confirmBtn.addEventListener('click', confirmRecording);
  cancelBtn.addEventListener('click', cancelRecording);
}

/**
 * Initiates dragging when mouse down on header
 */
function onDragStart(e) {
  isDragging = true;
  
  const rect = overlayElement.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  
  overlayElement.style.cursor = 'grabbing';
  e.preventDefault();
}

/**
 * Updates overlay position during drag
 */
function onDrag(e) {
  if (!isDragging) return;
  
  const x = e.clientX - dragOffsetX;
  const y = e.clientY - dragOffsetY;
  
  // Keep overlay within viewport bounds
  const maxX = window.innerWidth - overlayElement.offsetWidth;
  const maxY = window.innerHeight - overlayElement.offsetHeight;
  
  const boundedX = Math.max(0, Math.min(x, maxX));
  const boundedY = Math.max(0, Math.min(y, maxY));
  
  overlayElement.style.left = `${boundedX}px`;
  overlayElement.style.top = `${boundedY}px`;
  overlayElement.style.right = 'auto';
  overlayElement.style.bottom = 'auto';
}

/**
 * Ends dragging when mouse up
 */
function onDragEnd() {
  if (!isDragging) return;
  
  isDragging = false;
  overlayElement.style.cursor = 'default';
  
  // Optional: Snap to edges or corners (docking behavior)
  dockOverlay();
}

/**
 * Snaps overlay to nearest edge or corner for better docking
 */
function dockOverlay() {
  const rect = overlayElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const padding = 20;
  
  // Determine if closer to left or right edge
  const snapToRight = centerX > viewportWidth / 2;
  
  // Determine if closer to top or bottom edge
  const snapToBottom = centerY > viewportHeight / 2;
  
  // Apply snapping with smooth transition
  overlayElement.style.transition = 'all 0.2s ease-out';
  
  if (snapToRight) {
    overlayElement.style.right = `${padding}px`;
    overlayElement.style.left = 'auto';
  } else {
    overlayElement.style.left = `${padding}px`;
    overlayElement.style.right = 'auto';
  }
  
  if (snapToBottom) {
    overlayElement.style.bottom = `${padding}px`;
    overlayElement.style.top = 'auto';
  } else {
    overlayElement.style.top = `${padding}px`;
    overlayElement.style.bottom = 'auto';
  }
  
  // Remove transition after animation completes
  setTimeout(() => {
    overlayElement.style.transition = '';
  }, 200);
}

// ============================================================================
// AUDIO RECORDING FUNCTIONALITY
// ============================================================================

/**
 * Toggles audio recording on/off
 */
async function toggleRecording() {
  if (isRecording) {
    stopRecording(false);
  } else {
    await startRecording();
  }
}

/**
 * Starts audio recording with waveform visualization
 */
async function startRecording() {
  try {
    // Request microphone access
    audioStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    
    // Initialize Web Audio API for visualization
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);
    
    // Initialize MediaRecorder
    const options = { mimeType: getMimeType() };
    mediaRecorder = new MediaRecorder(audioStream, options);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      // Recording stopped, audio chunks are ready for processing
      console.log('[Content Script] Recording stopped, audio chunks:', audioChunks.length);
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('[Content Script] MediaRecorder error:', event.error);
      handleRecordingError(event.error);
    };
    
    // Start recording
    mediaRecorder.start();
    isRecording = true;
    
    // Update UI
    updateUIForRecording(true);
    
    // Start waveform animation
    startWaveformAnimation();
    
    console.log('[Content Script] Recording started');
    
  } catch (error) {
    console.error('[Content Script] Failed to start recording:', error);
    handleRecordingError(error);
  }
}

/**
 * Stops audio recording and optionally keeps the audio data
 */
function stopRecording(keepData = true) {
  if (!isRecording) return;
  
  try {
    // Stop MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    // Stop all audio tracks
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }
    
    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
    
    // Stop waveform animation
    stopWaveformAnimation();
    
    isRecording = false;
    
    // Update UI
    updateUIForRecording(false);
    
    if (!keepData) {
      // Discard audio data
      audioChunks = [];
    }
    
    console.log('[Content Script] Recording stopped');
    
  } catch (error) {
    console.error('[Content Script] Error stopping recording:', error);
    handleRecordingError(error);
  }
}

/**
 * Returns the best available MIME type for MediaRecorder
 */
function getMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/wav'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return ''; // Use default
}

// ============================================================================
// WAVEFORM VISUALIZATION
// ============================================================================

/**
 * Starts the waveform animation loop
 */
function startWaveformAnimation() {
  const canvas = document.getElementById('audio-recorder-waveform');
  if (!canvas || !analyser) return;
  
  const canvasContext = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  function draw() {
    if (!isRecording) return;
    
    animationFrameId = requestAnimationFrame(draw);
    
    // Get audio data
    analyser.getByteTimeDomainData(dataArray);
    
    // Clear canvas
    canvasContext.fillStyle = 'rgba(0, 0, 0, 0.1)';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw waveform
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = '#4CAF50';
    canvasContext.beginPath();
    
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      
      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
  }
  
  draw();
}

/**
 * Stops the waveform animation loop
 */
function stopWaveformAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // Clear canvas
  const canvas = document.getElementById('audio-recorder-waveform');
  if (canvas) {
    const canvasContext = canvas.getContext('2d');
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

/**
 * Updates UI elements based on recording state
 */
function updateUIForRecording(recording) {
  const micBtn = document.getElementById('audio-recorder-mic-btn');
  const confirmBtn = document.getElementById('audio-recorder-confirm-btn');
  const waveform = document.getElementById('audio-recorder-waveform');
  
  if (!micBtn || !confirmBtn || !waveform) return;
  
  if (recording) {
    micBtn.classList.add('recording');
    micBtn.innerHTML = '<span class="mic-icon recording-pulse">⏸️</span>';
    waveform.classList.add('active');
    confirmBtn.disabled = false;
  } else {
    micBtn.classList.remove('recording');
    micBtn.innerHTML = '<span class="mic-icon">🎤</span>';
    waveform.classList.remove('active');
    
    // Only enable confirm if we have audio data
    confirmBtn.disabled = audioChunks.length === 0;
  }
}

// ============================================================================
// RECORDING WORKFLOW MANAGEMENT
// ============================================================================

/**
 * Confirms the recording and sends it to the service worker for processing
 */
async function confirmRecording() {
  if (audioChunks.length === 0) {
    console.warn('[Content Script] No audio data to confirm');
    return;
  }
  
  try {
    // Create audio blob from chunks
    const audioBlob = new Blob(audioChunks, { type: getMimeType() });
    
    console.log('[Content Script] Confirming recording, blob size:', audioBlob.size);
    
    // Convert blob to base64 for message passing
    const base64Audio = await blobToBase64(audioBlob);
    
    // TODO: Send audio data to service worker for API processing
    chrome.runtime.sendMessage({
      type: 'AUDIO_RECORDED',
      payload: {
        audioData: base64Audio,
        mimeType: audioBlob.type,
        size: audioBlob.size,
        timestamp: Date.now()
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Content Script] Error sending message:', chrome.runtime.lastError);
        handleRecordingError(chrome.runtime.lastError);
        return;
      }
      
      if (response && response.success) {
        console.log('[Content Script] Recording sent successfully');
        handleTranscriptionResult(response.transcription);
      } else {
        console.error('[Content Script] Service worker returned error:', response?.error);
        handleRecordingError(response?.error || 'Unknown error');
      }
    });
    
    // Reset state
    audioChunks = [];
    updateUIForRecording(false);
    
  } catch (error) {
    console.error('[Content Script] Error confirming recording:', error);
    handleRecordingError(error);
  }
}

/**
 * Cancels the current recording and discards audio data
 */
function cancelRecording() {
  console.log('[Content Script] Canceling recording');
  
  // Stop recording and discard data
  if (isRecording) {
    stopRecording(false);
  }
  
  // Clear audio chunks
  audioChunks = [];
  
  // Update UI
  updateUIForRecording(false);
  
  // Optionally remove the overlay
  // removeOverlay();
}

// ============================================================================
// TEXT INSERTION & CLIPBOARD
// ============================================================================

/**
 * Handles the transcription result from the service worker
 */
function handleTranscriptionResult(transcription) {
  if (!transcription || typeof transcription !== 'string') {
    console.warn('[Content Script] Invalid transcription result');
    return;
  }
  
  console.log('[Content Script] Received transcription:', transcription);
  
  // Attempt to insert at cursor position in focused element
  if (lastFocusedElement && isEditableElement(lastFocusedElement)) {
    insertTextAtCursor(lastFocusedElement, transcription);
  } else {
    // Fallback to clipboard
    copyToClipboard(transcription);
  }
}

/**
 * Checks if an element is editable (input, textarea, contenteditable)
 */
function isEditableElement(element) {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'input' || tagName === 'textarea') {
    return !element.disabled && !element.readOnly;
  }
  
  if (element.contentEditable === 'true') {
    return true;
  }
  
  return false;
}

/**
 * Inserts text at the cursor position in an editable element
 */
function insertTextAtCursor(element, text) {
  try {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'input' || tagName === 'textarea') {
      // Handle input/textarea elements
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const currentValue = element.value;
      
      element.value = currentValue.substring(0, start) + text + currentValue.substring(end);
      
      // Move cursor to end of inserted text
      const newPosition = start + text.length;
      element.setSelectionRange(newPosition, newPosition);
      
      // Trigger input event for frameworks
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('[Content Script] Text inserted into input/textarea');
      
    } else if (element.contentEditable === 'true') {
      // Handle contenteditable elements
      const selection = window.getSelection();
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log('[Content Script] Text inserted into contenteditable');
      }
    }
    
  } catch (error) {
    console.error('[Content Script] Error inserting text:', error);
    // Fallback to clipboard
    copyToClipboard(text);
  }
}

/**
 * Copies text to clipboard as a fallback
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('[Content Script] Text copied to clipboard');
    
    // Show user feedback
    showNotification('Transcription copied to clipboard!');
    
  } catch (error) {
    console.error('[Content Script] Error copying to clipboard:', error);
    showNotification('Error: Could not copy to clipboard', 'error');
  }
}

/**
 * Shows a temporary notification to the user
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `audio-recorder-notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================================================
// FOCUS TRACKING
// ============================================================================

/**
 * Tracks the last focused editable element
 */
function trackFocusedElement() {
  document.addEventListener('focusin', (e) => {
    if (isEditableElement(e.target)) {
      lastFocusedElement = e.target;
      console.log('[Content Script] Tracking focused element:', e.target.tagName);
    }
  });
  
  document.addEventListener('focusout', (e) => {
    // Keep reference to last focused element even after blur
    // This allows insertion after recording completes
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handles recording errors and shows user feedback
 */
function handleRecordingError(error) {
  console.error('[Content Script] Recording error:', error);
  
  let errorMessage = 'Recording error occurred';
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    errorMessage = 'Microphone permission denied';
  } else if (error.name === 'NotFoundError') {
    errorMessage = 'No microphone found';
  } else if (error.name === 'NotReadableError') {
    errorMessage = 'Microphone is already in use';
  }
  
  showNotification(errorMessage, 'error');
  
  // Clean up and reset state
  if (isRecording) {
    stopRecording(false);
  }
  
  audioChunks = [];
  updateUIForRecording(false);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts a Blob to base64 string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Listens for messages from the service worker or popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content Script] Received message:', message);
  
  switch (message.type) {
    case 'SHOW_OVERLAY':
      createOverlay();
      sendResponse({ success: true });
      break;
      
    case 'HIDE_OVERLAY':
      removeOverlay();
      sendResponse({ success: true });
      break;
      
    case 'START_RECORDING':
      startRecording().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep channel open for async response
      
    case 'STOP_RECORDING':
      stopRecording(true);
      sendResponse({ success: true });
      break;
      
    case 'TRANSCRIPTION_RESULT':
      handleTranscriptionResult(message.payload.text);
      sendResponse({ success: true });
      break;
      
    default:
      console.warn('[Content Script] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// ============================================================================
// CLEANUP & DISCONNECT HANDLING
// ============================================================================

/**
 * Cleans up resources when content script is disconnected
 */
function cleanup() {
  console.log('[Content Script] Cleaning up...');
  
  // Stop any active recording
  if (isRecording) {
    stopRecording(false);
  }
  
  // Remove overlay
  removeOverlay();
  
  // Clean up event listeners
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', onDragEnd);
  
  console.log('[Content Script] Cleanup complete');
}

// Handle page unload
window.addEventListener('beforeunload', cleanup);

// Handle extension disconnect
chrome.runtime.connect({ name: 'content-script' }).onDisconnect.addListener(() => {
  console.log('[Content Script] Disconnected from extension');
  cleanup();
});

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the content script
 */
function init() {
  console.log('[Content Script] Initializing audio recorder content script');
  
  // Start tracking focused elements
  trackFocusedElement();
  
  // TODO: Check user preferences for auto-show overlay
  // For now, overlay will be shown via message from popup/service worker
  
  console.log('[Content Script] Initialization complete');
}

// Start the content script
init();
