/**
 * Content Script
 * Injected into webpages to interact with the DOM and capture content
 */

// TODO: Set up a build process (e.g., Vite, Webpack) to handle imports at build time.
// Currently using dynamic imports to access shared modules without a bundler.

(async () => {
  try {
    // Dynamic import for shared modules
    // Note: These files must be listed in web_accessible_resources in manifest.json
    const typesSrc = chrome.runtime.getURL('shared/types.js');
    const { MSG_TYPES } = await import(typesSrc);
    
    console.log('Content script initialized');

    // Example: Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === MSG_TYPES.TRANSCRIPTION_UPDATE) {
        console.log('Received transcription update:', message.payload);
        // TODO: Update UI overlay if exists
      }
    });

    // TODO: Implement page content extraction
    // function extractContent() { ... }

  } catch (err) {
    console.error('Error initializing content script:', err);
  }
})();
