// Content script for Stumbleable Chrome Extension
// Injected into all pages to enable keyboard shortcuts and page interaction

// Listen for keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Check if user is typing in an input field
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
    }

    // Ctrl+Shift+S or Cmd+Shift+S - Stumble
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'stumble' });
    }

    // Ctrl+Shift+D or Cmd+Shift+D - Save current page
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        saveCurrentPage();
    }

    // Ctrl+Shift+U or Cmd+Shift+U - Submit current page
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        submitCurrentPage();
    }
});

// Save current page
async function saveCurrentPage() {
    const url = window.location.href;
    const title = document.title;

    const response = await chrome.runtime.sendMessage({
        action: 'saveContent',
        data: { url, title }
    });

    if (response.success) {
        showPageNotification('✅ Saved to Stumbleable!', 3000);
    } else {
        showPageNotification('❌ Failed to save', 3000);
    }
}

// Submit current page
async function submitCurrentPage() {
    const url = window.location.href;
    const title = document.title;

    const response = await chrome.runtime.sendMessage({
        action: 'submitContent',
        data: { url, title }
    });

    if (response.success) {
        showPageNotification('✅ Submitted to Stumbleable!', 3000);
    } else {
        showPageNotification('❌ Failed to submit', 3000);
    }
}

// Show notification on page
function showPageNotification(message: string, duration: number = 3000) {
    // Remove existing notification if any
    const existing = document.getElementById('stumbleable-notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'stumbleable-notification';
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(notification);

    // Remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, duration);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showNotification') {
        showPageNotification(request.message, request.duration);
    }
});
