import { MSG_TYPES } from '../shared/types.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../shared/storage_keys.js';

/**
 * Background Service Worker
 * Handles extension lifecycle, background tasks, and API coordination
 */

console.log('Service Worker initialized');

// Initialize default settings on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed');
  
  const result = await chrome.storage.sync.get(STORAGE_KEYS.USER_SETTINGS);
  if (!result[STORAGE_KEYS.USER_SETTINGS]) {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.USER_SETTINGS]: DEFAULT_SETTINGS
    });
    console.log('Default settings initialized');
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  // TODO: Handle messages
  switch (message.type) {
    case MSG_TYPES.START_RECORDING:
      // TODO: Implement recording logic
      break;
      
    case MSG_TYPES.ANALYZE_CONTENT:
      // TODO: Implement analysis logic
      // e.g., call AssemblyAI or Gemini
      break;
  }

  // Return true to indicate we wish to send a response asynchronously
  return true;
});
