import { ChromeMessageKeyEnum } from "@/types/contants";
import { GooglePlatform } from "@/utils/translate";
import { getPhoneticInfo } from "@/utils/phoneticUtils";
import { addToVocabulary } from "@/utils/vocabularyUtils";

// Initialize translation platforms
const translationPlatforms = {
  google: new GooglePlatform(),
  // Note: Other platforms require API keys and may not be available
};

// Default translation platform
const defaultPlatform = translationPlatforms.google;

/**
 * Notify content script that side panel is open
 */
function notifySidePanelOpen(tabId?: number) {
  if (!tabId) return;

  try {
    chrome.tabs.sendMessage(tabId, {
      action: 'SIDE_PANEL_OPEN',
      timestamp: Date.now()
    }).catch(error => {
      // Content script might not be loaded on this page, ignore
      console.debug('Could not send message to content script:', error);
    });
  } catch (error) {
    console.debug('Error sending side panel open message:', error);
  }
}

/**
 * Get target language from storage or use default
 */
async function getTargetLanguage(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["targetLanguage"], (result) => {
      // Default to Chinese if not set
      resolve(result.targetLanguage || "zh-CN");
    });
  });
}

function setupContextMenu() {
  chrome.contextMenus.create({
    id: "google-translate-sidepanel",
    title: "Google Translate Sidepanel",
    contexts: ["selection"],
  });

  // Add vocabulary context menu
  chrome.contextMenus.create({
    id: "add-to-vocabulary",
    title: "Add to Vocabulary",
    contexts: ["selection"],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true, // 点击工具栏图标直接打开侧边栏
  });
  setupContextMenu();
});

chrome.contextMenus.onClicked.addListener((data, tab) => {
  if (data.menuItemId === "google-translate-sidepanel") {
    // Make sure the side panel is open.
    chrome.sidePanel.open({ tabId: tab?.id });

    // Notify content script that side panel is open
    notifySidePanelOpen(tab?.id);

    // Store the last word in chrome.storage.session.
    setTimeout(() => chrome.storage.session.set({ lastWord: data.selectionText }), 100);
  } else if (data.menuItemId === "add-to-vocabulary" && data.selectionText) {
    // Add selected text to vocabulary
    addSelectionToVocabulary(data.selectionText, tab?.id);
  }
});

/**
 * Add selected text to vocabulary with translation
 */
async function addSelectionToVocabulary(text: string, tabId?: number) {
  try {
    // Get target language from user preference
    const targetLanguage = await getTargetLanguage();

    // Translate the text
    const translationResult = await defaultPlatform.translate(text, "auto", targetLanguage);

    // Get phonetic info if available
    const phoneticInfo = await getPhoneticInfo(text, "auto");

    // Add to vocabulary
    await addToVocabulary(
      text,
      translationResult.result,
      translationResult.detectedLanguage || "auto",
      targetLanguage,
      defaultPlatform.name,
      phoneticInfo || undefined,
      ["context-menu"],
      "Added via context menu"
    );

    // Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/favicon-48x48.png",
      title: "Added to Vocabulary",
      message: `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" has been added to your vocabulary.`,
    });
  } catch (error) {
    console.error("Failed to add to vocabulary:", error);
  }
}

/**
 * Handle hover translation requests
 */
async function handleHoverTranslation(text: string, sendResponse: (response: any) => void) {
  try {
    // Get target language from user preference
    const targetLanguage = await getTargetLanguage();

    // Translate the text
    const translationResult = await defaultPlatform.translate(text, "auto", targetLanguage);

    // Get phonetic info if available
    const phoneticInfo = await getPhoneticInfo(text, "auto");

    sendResponse({
      success: true,
      translation: translationResult.result,
      phonetic: phoneticInfo?.phonetic,
      originalText: text,
    });
  } catch (error) {
    console.error("Hover translation failed:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
      originalText: text,
    });
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: { action: string; text?: string; data?: any },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    // Handle selection text for side panel
    if (message.action === ChromeMessageKeyEnum.LAST_SELECTION_TEXT) {
      if (message.text) {
        setTimeout(() => chrome.storage.session.set({ lastWord: message.text }), 100);
      }
      sendResponse({ success: true });
    }

    // Handle hover translation requests
    else if (message.action === "TRANSLATE_HOVER" && message.text) {
      handleHoverTranslation(message.text, sendResponse);
      return true; // Keep message channel open for async response
    }

    // Handle vocabulary addition
    else if (message.action === "ADD_TO_VOCABULARY" && message.data) {
      const { originalText, translatedText } = message.data;

      // Get target language from user preference
      getTargetLanguage().then((targetLanguage) => {
        addToVocabulary(
          originalText,
          translatedText,
          "auto",
          targetLanguage,
          defaultPlatform.name,
          undefined,
          ["hover"],
          "Added via hover translation"
        ).then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          console.error("Failed to add to vocabulary:", error);
          sendResponse({ success: false, error: error.message });
        });
      }).catch((error) => {
        console.error("Failed to get target language:", error);
        sendResponse({ success: false, error: "Failed to get target language" });
      });

      return true; // Keep message channel open for async response
    }

    // Handle configuration updates
    else if (message.action === "UPDATE_HOVER_CONFIG") {
      const hoverConfig = (message as any).config;
      chrome.storage.local.set({ hoverConfig }, () => {
        sendResponse({ success: true });
      });
      return true;
    }

    return true;
  },
);

// Listen for installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Set default configuration
    chrome.storage.local.set({
      hoverConfig: {
        enabled: true,
        delay: 300,
        position: 'cursor',
        maxWidth: 300,
        maxHeight: 200,
        showPhonetic: true,
        showFavoriteButton: true,
        autoCloseDelay: 3000,
      },
      phoneticConfig: {
        enabled: true,
        apiProvider: "local",
        autoFetch: true,
        showInTranslation: true,
        showAudioButton: true,
      },
      vocabularyConfig: {
        maxVocabularyItems: 500,
        enabled: true,
        autoAddFavorites: false,
        defaultTags: ["new", "important", "difficult"],
        exportFormat: "csv",
      },
    });
  }
});
