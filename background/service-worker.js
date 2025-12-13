/**
 * Service Worker - Background Script
 * 
 * TODO: Implement service worker to handle:
 * - Audio data processing
 * - API communication for transcription
 * - Message routing between content script and popup
 */

console.log('[Service Worker] Audio Recorder extension loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Service Worker] Received message:', message.type);
  
  if (message.type === 'AUDIO_RECORDED') {
    // TODO: Send audio to transcription API
    // For now, return a mock response
    console.log('[Service Worker] Audio data received, size:', message.payload.size);
    
    // Mock transcription response
    setTimeout(() => {
      sendResponse({
        success: true,
        transcription: 'This is a mock transcription. TODO: Implement real API integration.'
      });
    }, 1000);
    
    return true; // Keep channel open for async response
  }
  
  return false;
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Service Worker] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // TODO: Set default preferences
    console.log('[Service Worker] First install - setting defaults');
  }
});
