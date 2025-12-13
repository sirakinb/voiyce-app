import { MSG_TYPES } from '../shared/types.js';
import { STORAGE_KEYS } from '../shared/storage_keys.js';

/**
 * Popup Script
 * Handles user interaction in the extension popup
 */

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const statusDiv = document.getElementById('status');
  
  // Initialize state
  // TODO: Check current recording state from background/storage
  
  startBtn.addEventListener('click', async () => {
    try {
      // TODO: Request microphone permission if needed
      
      await chrome.runtime.sendMessage({
        type: MSG_TYPES.START_RECORDING
      });
      
      updateUI(true);
      statusDiv.textContent = 'Recording...';
    } catch (err) {
      console.error('Failed to start recording:', err);
      statusDiv.textContent = 'Error: ' + err.message;
    }
  });
  
  stopBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({
        type: MSG_TYPES.STOP_RECORDING
      });
      
      updateUI(false);
      statusDiv.textContent = 'Ready';
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  });
  
  analyzeBtn.addEventListener('click', async () => {
    statusDiv.textContent = 'Analyzing...';
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        // Send message to background to analyze content
        // Alternatively, we could send to content script directly
        await chrome.runtime.sendMessage({
          type: MSG_TYPES.ANALYZE_CONTENT,
          payload: { tabId: tab.id }
        });
      }
    } catch (err) {
      statusDiv.textContent = 'Error starting analysis';
      console.error(err);
    }
  });
  
  function updateUI(isRecording) {
    startBtn.disabled = isRecording;
    stopBtn.disabled = !isRecording;
  }
});
