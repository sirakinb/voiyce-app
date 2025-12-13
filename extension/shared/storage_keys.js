/**
 * Storage keys used for chrome.storage
 */

export const STORAGE_KEYS = {
  // User settings
  USER_SETTINGS: 'userSettings',
  
  // API Keys (if stored locally - prefer backend or secure storage)
  API_KEYS: 'apiKeys',
  
  // Session data
  CURRENT_TRANSCRIPT: 'currentTranscript',
  HISTORY: 'history',
};

export const DEFAULT_SETTINGS = {
  autoProcess: false,
  language: 'en-US',
};
