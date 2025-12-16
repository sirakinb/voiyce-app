chrome.runtime.onInstalled.addListener(() => {
    console.log("Voiyce Extension Installed");
});

chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_UI" });
    }
});
