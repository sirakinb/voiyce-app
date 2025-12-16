// Voiyce Content Script

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let dataArray = null;
let canvas, canvasCtx;
let animationId;
let transcribedText = "";
let stream = null;

// UI Elements Reference
let container, mainBtn, statusText, secondaryActions, confirmBtn, cancelBtn, waveformContainer;

// Config
const BACKEND_URL = 'http://localhost:3000/transcribe';

function initialize() {
  if (document.getElementById('voiyce-container')) return; // Already injected
  createUI();
  setupDrag();
}

function createUI() {
  const uiHTML = `
    <div id="voiyce-content-wrapper">
      <div id="voiyce-status-text">Tap mic to speak</div>
      <textarea id="voiyce-edit-area" style="display: none;"></textarea>
      <div id="voiyce-loader" style="display: none;">
        <div class="voiyce-spinner"></div>
        <span>Processing...</span>
      </div>
    </div>
    
    <!-- Waveform Container - Flexible Positioning -->
    <div id="voiyce-waveform-container">
      <canvas id="voiyce-waveform-canvas"></canvas>
    </div>

    <!-- Bottom Controls Bar -->
    <div id="voiyce-controls-bar">
      <div class="voiyce-secondary-actions" id="voiyce-secondary">
        <button id="voiyce-summarize" class="voiyce-action-btn" title="Summarize">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 6 6.5 9.5 3 12l3.5 2.5L9 18l2.5-3.5L15 12l-3.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
        </button>
        <button id="voiyce-check" class="voiyce-action-btn" title="Copy">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 5h-4V4h4v2z"/></svg>
        </button>
        <button id="voiyce-cancel" class="voiyce-action-btn" title="Clear">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="12" r="8" /></svg>
        </button>
      </div>
      
      <button id="voiyce-main-btn">
        <svg id="voiyce-mic-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        <svg id="voiyce-stop-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 6h12v12H6z"/></svg>
      </button>
    </div>

    <button id="voiyce-close">✕</button>
  `;

  container = document.createElement('div');
  container.id = 'voiyce-container';
  container.innerHTML = uiHTML;
  document.body.appendChild(container);

  // References
  mainBtn = document.getElementById('voiyce-main-btn');
  statusText = document.getElementById('voiyce-status-text');
  waveformContainer = document.getElementById('voiyce-waveform-container');
  canvas = document.getElementById('voiyce-waveform-canvas');
  canvasCtx = canvas.getContext('2d');
  secondaryActions = document.getElementById('voiyce-secondary');
  confirmBtn = document.getElementById('voiyce-check');
  cancelBtn = document.getElementById('voiyce-cancel');
  const summarizeBtn = document.getElementById('voiyce-summarize');

  // Set canvas size
  setTimeout(() => {
    const rect = waveformContainer.getBoundingClientRect();
    canvas.width = rect.width || 600;
    canvas.height = rect.height || 40;
  }, 100);

  // Listeners
  mainBtn.addEventListener('click', toggleRecording);
  document.getElementById('voiyce-close').addEventListener('click', () => container.style.display = 'none');
  confirmBtn.addEventListener('click', confirmTranscription);
  cancelBtn.addEventListener('click', resetUI);
  summarizeBtn.addEventListener('click', summarizeText);

  // Message Listener for Toolbar Click
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TOGGLE_UI") {
      if (container.style.display === 'none') {
        container.style.display = 'flex';
      } else {
        container.style.display = 'none';
      }
    }
  });
}

// Drag Logic
function setupDrag() {
  // Use the status text as the drag handle
  const dragHandle = document.getElementById('voiyce-status-text');
  if (!dragHandle) return; // Safety check

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  dragHandle.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    dragHandle.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      setTranslate(currentX, currentY, container);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(calc(-50% + ${xPos}px), ${yPos}px)`;
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    dragHandle.style.cursor = 'grab';
  }
}

async function toggleRecording() {
  if (!isRecording) {
    await startRecording();
  } else {
    stopRecording();
  }
}

async function startRecording() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Audio context setup for waveform
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    // MediaRecorder
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = handleRecordingStop;

    mediaRecorder.start();
    isRecording = true;

    // UI Update
    mainBtn.classList.add('recording');
    document.getElementById('voiyce-mic-icon').style.display = 'none';
    document.getElementById('voiyce-stop-icon').style.display = 'block';

    // Hide default status text but KEEP transcribed text if appended
    if (transcribedText.length === 0) {
      statusText.style.opacity = '0';
      waveformContainer.className = 'initial-recording active';
    } else {
      // Appending: Text stays visible
      waveformContainer.className = 'append-recording active';
    }

    // Set canvas size now that container is visible
    // Force layout update for accurate rect
    setTimeout(() => {
      const rect = waveformContainer.getBoundingClientRect();
      canvas.width = rect.width || 600;
      canvas.height = rect.height || 40;
    }, 0);

    visualize();
  } catch (err) {
    console.error("Error accessing mic:", err);
    statusText.innerText = "Mic Error! Allow permission.";
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  if (audioContext) {
    audioContext.close();
  }
  cancelAnimationFrame(animationId);

  isRecording = false;
  mainBtn.classList.remove('recording');
  document.getElementById('voiyce-mic-icon').style.display = 'block';
  document.getElementById('voiyce-stop-icon').style.display = 'none';

  // Hide waveform, show loader
  waveformContainer.classList.remove('active');
  statusText.style.display = 'none'; // Hide "Tap mic..." text
  const loader = document.getElementById('voiyce-loader');
  loader.style.display = 'flex';

  // Clear canvas
  if (canvasCtx) {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function visualize() {
  if (!isRecording) return;

  animationId = requestAnimationFrame(visualize);
  analyser.getByteFrequencyData(dataArray);

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Premium waveform settings
  const bars = 40; // Number of bars
  const barWidth = 4;
  const gap = 3;
  const totalWidth = bars * (barWidth + gap);
  const startX = (canvas.width - totalWidth) / 2;
  const centerY = canvas.height / 2;

  // Create gradient
  const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#00d4ff');
  gradient.addColorStop(0.5, '#a855f7');
  gradient.addColorStop(1, '#00d4ff');

  // Add glow effect
  canvasCtx.shadowBlur = 15;
  canvasCtx.shadowColor = '#00d4ff';

  for (let i = 0; i < bars; i++) {
    // Sample from frequency data
    const dataIndex = Math.floor(i * (dataArray.length / bars));
    const value = dataArray[dataIndex];
    const barHeight = Math.max(4, (value / 255) * (canvas.height * 0.7));

    const x = startX + i * (barWidth + gap);

    // Draw mirrored bars (from center going up and down)
    canvasCtx.fillStyle = gradient;
    canvasCtx.beginPath();
    canvasCtx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 2);
    canvasCtx.fill();
  }

  // Reset shadow for next frame
  canvasCtx.shadowBlur = 0;
}

async function handleRecordingStop() {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Chrome uses webm
  await sendToBackend(audioBlob);
}

async function sendToBackend(blob) {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Backend failed');

    const data = await response.json();

    // Append new text to existing transcribedText
    if (transcribedText.length > 0) {
      transcribedText += " " + data.text;
    } else {
      transcribedText = data.text;
    }

    // Show editable textarea instead of plain text
    document.getElementById('voiyce-loader').style.display = 'none'; // Hide loader

    const editArea = document.getElementById('voiyce-edit-area');
    editArea.style.display = 'block';

    // If user edited text manually, we should respect that and append to the current value
    // (Assuming user is not typing WHILE recording, which is unlikely)
    // But let's check input value vs variable
    if (editArea.value.length > 0 && editArea.value !== transcribedText) {
      // User made edits, append to visual text
      editArea.value += " " + data.text;
      // Sync back to variable
      transcribedText = editArea.value;
    } else {
      editArea.value = transcribedText;
    }

    editArea.style.height = 'auto'; // Reset height
    editArea.style.height = Math.min(editArea.scrollHeight, 300) + 'px'; // Auto grow

    secondaryActions.classList.add('active');

  } catch (err) {
    console.error(err);
    document.getElementById('voiyce-loader').style.display = 'none';
    statusText.style.display = 'block';
    statusText.innerText = "Error w/ Backend";
  }
}

function confirmTranscription() {
  // Get text from textarea (in case user edited it)
  const editArea = document.getElementById('voiyce-edit-area');
  transcribedText = editArea.value;

  navigator.clipboard.writeText(transcribedText).then(() => {
    showToast("Copied to clipboard!");
  });

  resetUI();
}

async function summarizeText() {
  const editArea = document.getElementById('voiyce-edit-area');
  // Use current edited text if available, otherwise transcribedText
  const currentText = editArea.style.display !== 'none' ? editArea.value : transcribedText;

  if (!currentText) return;

  const originalText = statusText.innerText;

  // temporary UI state
  editArea.style.display = 'none';
  const loader = document.getElementById('voiyce-loader');
  loader.style.display = 'flex';
  loader.querySelector('span').innerText = "Summarizing...";

  try {
    const response = await fetch('http://localhost:3000/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: currentText })
    });

    if (!response.ok) throw new Error('Summarize failed');

    const data = await response.json();
    transcribedText = data.text;

    // Update and show textarea
    loader.style.display = 'none';
    loader.querySelector('span').innerText = "Processing..."; // Reset text

    editArea.style.display = 'block';
    editArea.value = transcribedText;

    // Auto-resize
    editArea.style.height = 'auto';
    editArea.style.height = Math.min(editArea.scrollHeight, 300) + 'px';

  } catch (err) {
    console.error(err);
    // Revert UI
    loader.style.display = 'none';
    editArea.style.display = 'block';
    showToast("Summarize failed");
  }
}

function resetUI() {
  transcribedText = "";

  // Reset elements
  statusText.innerText = "Tap mic to speak";
  statusText.style.opacity = '1';
  statusText.style.display = 'block';

  const editArea = document.getElementById('voiyce-edit-area');
  editArea.style.display = 'none';
  editArea.value = "";

  const loader = document.getElementById('voiyce-loader');
  if (loader) {
    loader.style.display = 'none';
    loader.querySelector('span').innerText = "Processing...";
  }

  secondaryActions.classList.remove('active');
  waveformContainer.classList.remove('active');
  if (canvasCtx) {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function showToast(msg) {
  const original = statusText.innerText;
  statusText.innerText = msg;
  setTimeout(() => {
    statusText.innerText = original === msg ? "Tap mic to speak" : original;
  }, 2000);
}

// Init immediately
initialize();
