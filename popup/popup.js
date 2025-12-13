/**
 * Popup Script
 * 
 * Controls the extension popup UI
 */

document.addEventListener('DOMContentLoaded', () => {
  const showOverlayBtn = document.getElementById('show-overlay-btn');
  
  showOverlayBtn.addEventListener('click', async () => {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to show overlay
      chrome.tabs.sendMessage(tab.id, { type: 'SHOW_OVERLAY' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          console.log('Overlay shown successfully');
          window.close(); // Close popup
        }
      });
    } catch (error) {
      console.error('Error showing overlay:', error);
    }
  });
});
