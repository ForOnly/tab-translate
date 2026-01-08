import { ChromeMessageKeyEnum } from "@/types/contants";

// Configuration for hover translation
interface HoverConfig {
  enabled: boolean;
  delay: number;
  position: 'cursor' | 'above' | 'below';
  maxWidth: number;
  maxHeight: number;
  showPhonetic: boolean;
  showFavoriteButton: boolean;
  autoCloseDelay: number;
}

// Default configuration
const DEFAULT_HOVER_CONFIG: HoverConfig = {
  enabled: true,
  delay: 300,
  position: 'cursor',
  maxWidth: 300,
  maxHeight: 200,
  showPhonetic: true,
  showFavoriteButton: true,
  autoCloseDelay: 3000,
};

// Global variables
let debounceTimer: number | undefined;
let lastText: string = "";
let hoverDiv: HTMLDivElement | null = null;
let hoverConfig: HoverConfig = DEFAULT_HOVER_CONFIG;
let hoverTimeout: number | undefined;
let currentSelection: string = "";

// Side panel state
let sidePanelOpen = false;
let sidePanelTimeout: number | undefined;

/**
 * Set side panel open state with auto-reset timeout
 */
function setSidePanelOpen(isOpen: boolean, duration: number = 30000) { // 30 seconds default
  sidePanelOpen = isOpen;

  // Clear existing timeout
  if (sidePanelTimeout) {
    clearTimeout(sidePanelTimeout);
    sidePanelTimeout = undefined;
  }

  // Set timeout to auto-reset if opening
  if (isOpen) {
    sidePanelTimeout = setTimeout(() => {
      sidePanelOpen = false;
      sidePanelTimeout = undefined;
    }, duration) as unknown as number;
  }
}

// Load configuration from storage
function loadConfig() {
  chrome.storage.local.get(['hoverConfig'], (result) => {
    if (result.hoverConfig) {
      hoverConfig = { ...DEFAULT_HOVER_CONFIG, ...result.hoverConfig };
    }
  });
}

// Initialize
loadConfig();

// Listen for config changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.hoverConfig) {
    hoverConfig = { ...DEFAULT_HOVER_CONFIG, ...changes.hoverConfig.newValue };
  }
});

/**
 * Create hover translation element
 */
function createHoverElement(): HTMLDivElement {
  const div = document.createElement('div');
  div.id = 'tab-translate-hover';
  div.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 12px;
    max-width: ${hoverConfig.maxWidth}px;
    max-height: ${hoverConfig.maxHeight}px;
    overflow-y: auto;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    color: #374151;
    display: none;
    transition: opacity 0.2s ease;
  `;

  div.innerHTML = `
    <div class="hover-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div style="font-weight: 600; color: #2563eb;">翻译</div>
      <div class="hover-actions" style="display: flex; gap: 4px;">
        <button class="copy-btn" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #6b7280;" title="复制">
          📋
        </button>
        <button class="favorite-btn" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #6b7280;" title="收藏">
          ☆
        </button>
        <button class="close-btn" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #6b7280;" title="关闭">
          ×
        </button>
      </div>
    </div>
    <div class="original-text" style="margin-bottom: 8px; padding: 4px; background: #f9fafb; border-radius: 4px; font-size: 13px;"></div>
    <div class="phonetic" style="margin-bottom: 8px; font-size: 12px; color: #6b7280; display: none;"></div>
    <div class="translation" style="font-weight: 500; color: #111827;"></div>
    <div class="loading" style="display: none; text-align: center; color: #6b7280; padding: 8px;">
      翻译中...
    </div>
    <div class="error" style="display: none; color: #dc2626; font-size: 12px; margin-top: 4px;"></div>
  `;

  // Add event listeners
  const copyBtn = div.querySelector('.copy-btn') as HTMLElement | null;
  const favoriteBtn = div.querySelector('.favorite-btn') as HTMLElement | null;
  const closeBtn = div.querySelector('.close-btn') as HTMLElement | null;

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const translation = div.querySelector('.translation')?.textContent;
      if (translation) {
        navigator.clipboard.writeText(translation).then(() => {
          const original = copyBtn.textContent;
          copyBtn.textContent = '✅';
          setTimeout(() => {
            copyBtn.textContent = original;
          }, 1000);
        });
      }
    });
  }

  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
      const original = div.querySelector('.original-text')?.textContent;
      const translation = div.querySelector('.translation')?.textContent;
      if (original && translation) {
        // Send message to background to add to vocabulary
        chrome.runtime.sendMessage({
          action: 'ADD_TO_VOCABULARY',
          data: {
            originalText: original,
            translatedText: translation,
          }
        });

        favoriteBtn.textContent = '★';
        favoriteBtn.style.color = '#f59e0b';
        setTimeout(() => {
          favoriteBtn.textContent = '☆';
          favoriteBtn.style.color = '';
        }, 1000);
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', hideHover);
  }

  document.body.appendChild(div);
  return div;
}

/**
 * Show hover translation
 */
function showHover(text: string, x: number, y: number) {
  // Always send text to side panel for translation
  sendToSidePanel(text);

  if (!hoverConfig.enabled) {
    return;
  }

  // Don't show hover if side panel is open
  if (sidePanelOpen) {
    return;
  }

  if (!hoverDiv) {
    hoverDiv = createHoverElement();
  }

  // Clear any existing timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }

  // Set position
  const rect = hoverDiv.getBoundingClientRect();
  let posX = x;
  let posY = y;

  // Adjust position based on config
  switch (hoverConfig.position) {
    case 'above':
      posY = y - rect.height - 10;
      break;
    case 'below':
      posY = y + 20;
      break;
    case 'cursor':
    default:
      posY = y + 20;
      posX = x;
  }

  // Ensure the hover stays within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (posX + rect.width > viewportWidth) {
    posX = viewportWidth - rect.width - 10;
  }
  if (posY + rect.height > viewportHeight) {
    posY = viewportHeight - rect.height - 10;
  }
  if (posX < 10) posX = 10;
  if (posY < 10) posY = 10;

  hoverDiv.style.left = `${posX}px`;
  hoverDiv.style.top = `${posY}px`;

  // Show loading state
  (hoverDiv.querySelector('.original-text') as HTMLElement)!.textContent = text;
  (hoverDiv.querySelector('.translation') as HTMLElement)!.textContent = '';
  (hoverDiv.querySelector('.loading') as HTMLElement)!.style.display = 'block';
  (hoverDiv.querySelector('.error') as HTMLElement)!.style.display = 'none';
  (hoverDiv.querySelector('.phonetic') as HTMLElement)!.style.display = 'none';
  hoverDiv.style.display = 'block';
  hoverDiv.style.opacity = '1';

  currentSelection = text;

  // Request translation
  chrome.runtime.sendMessage({
    action: 'TRANSLATE_HOVER',
    text: text,
  }, {}, (response: any) => {
    if (!hoverDiv || !hoverDiv.isConnected) return;

    const loadingEl = hoverDiv.querySelector('.loading') as HTMLElement | null;
    const translationEl = hoverDiv.querySelector('.translation') as HTMLElement | null;
    const errorEl = hoverDiv.querySelector('.error') as HTMLElement | null;
    const phoneticEl = hoverDiv.querySelector('.phonetic') as HTMLElement | null;

    if (loadingEl) loadingEl.style.display = 'none';

    if (response && response.success) {
      if (translationEl) translationEl.textContent = response.translation;

      // Show phonetic if enabled and available
      if (hoverConfig.showPhonetic && response.phonetic && phoneticEl) {
        phoneticEl.textContent = `音标: ${response.phonetic}`;
        phoneticEl.style.display = 'block';
      }

      // Update favorite button state
      const favoriteBtn = hoverDiv.querySelector('.favorite-btn') as HTMLElement | null;
      if (favoriteBtn && hoverConfig.showFavoriteButton) {
        favoriteBtn.style.display = 'inline-block';
      }
    } else {
      if (errorEl) {
        errorEl.textContent = response?.error || '翻译失败';
        errorEl.style.display = 'block';
      }
      if (translationEl) {
        translationEl.textContent = '翻译失败';
      }
    }

    // Auto-close after delay
    if (hoverConfig.autoCloseDelay > 0) {
      hoverTimeout = setTimeout(() => {
        hideHover();
      }, hoverConfig.autoCloseDelay) as unknown as number;
    }
  });
}

/**
 * Hide hover translation
 */
function hideHover() {
  if (hoverDiv) {
    hoverDiv.style.opacity = '0';
    setTimeout(() => {
      if (hoverDiv && hoverDiv.style.opacity === '0') {
        hoverDiv.style.display = 'none';
      }
    }, 200);
  }
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = undefined;
  }
}

/**
 * Send text to side panel (fallback when hover is disabled)
 */
function sendToSidePanel(text: string) {
  chrome?.runtime?.sendMessage &&
    chrome.runtime.sendMessage({
      action: ChromeMessageKeyEnum.LAST_SELECTION_TEXT,
      text: text,
    });
}

/**
 * Get mouse position from event
 */
function getMousePosition(event: MouseEvent) {
  return { x: event.clientX, y: event.clientY };
}

// Main selection change handler
document.addEventListener("selectionchange", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text === lastText) return;

    lastText = text;

    // Get mouse position from last mouseup event
    const mouseupHandler = (event: MouseEvent) => {
      if (hoverConfig.enabled) {
        showHover(text, event.clientX, event.clientY);
      } else {
        sendToSidePanel(text);
      }
      document.removeEventListener('mouseup', mouseupHandler);
    };

    document.addEventListener('mouseup', mouseupHandler);
  }, hoverConfig.delay);
});

// Hide hover when clicking outside
document.addEventListener('mousedown', (event) => {
  if (hoverDiv &&
      hoverDiv.style.display === 'block' &&
      !hoverDiv.contains(event.target as Node)) {
    hideHover();
  }
});

// Hide hover when scrolling
let scrollTimer: number | undefined;
window.addEventListener('scroll', () => {
  if (hoverDiv && hoverDiv.style.display === 'block') {
    hideHover();
  }
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UPDATE_HOVER_CONFIG') {
    hoverConfig = { ...DEFAULT_HOVER_CONFIG, ...(message as any).config };
    (sendResponse as any)({ success: true });
  }

  if (message.action === 'SIDE_PANEL_OPEN') {
    // Side panel has been opened, disable hover translation temporarily
    setSidePanelOpen(true, 30000); // 30 seconds
    (sendResponse as any)({ success: true });
  }

  if (message.action === 'TRANSLATE_HOVER_RESULT') {
    // This message is sent from background with translation result
    if (hoverDiv && hoverDiv.style.display === 'block' && currentSelection === (message as any).originalText) {
      const translationEl = hoverDiv.querySelector('.translation') as HTMLElement | null;
      const loadingEl = hoverDiv.querySelector('.loading') as HTMLElement | null;
      const errorEl = hoverDiv.querySelector('.error') as HTMLElement | null;
      const phoneticEl = hoverDiv.querySelector('.phonetic') as HTMLElement | null;

      if (loadingEl) loadingEl.style.display = 'none';

      if (message.success) {
        if (translationEl) translationEl.textContent = message.translation;

        if (hoverConfig.showPhonetic && message.phonetic && phoneticEl) {
          phoneticEl.textContent = `音标: ${message.phonetic}`;
          phoneticEl.style.display = 'block';
        }
      } else {
        if (errorEl) {
          errorEl.textContent = message.error || '翻译失败';
          errorEl.style.display = 'block';
        }
        if (translationEl) {
          translationEl.textContent = '翻译失败';
        }
      }

      (sendResponse as any)({ success: true });
    }
  }

  return true; // Keep message channel open for async response
});

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
  if (hoverDiv && hoverDiv.parentNode) {
    hoverDiv.parentNode.removeChild(hoverDiv);
  }

  // Clear side panel timeout
  if (sidePanelTimeout) {
    clearTimeout(sidePanelTimeout);
    sidePanelTimeout = undefined;
  }
});
