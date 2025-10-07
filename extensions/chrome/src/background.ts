// Background service worker for Stumbleable Chrome Extension
// Handles context menus, keyboard commands, and communication with the API

const API_BASE_URL = 'http://localhost:3000'; // Will use production URL when deployed
const DISCOVERY_API_URL = 'http://localhost:7001';
const INTERACTION_API_URL = 'http://localhost:7002';
const USER_API_URL = 'http://localhost:7003';

interface StorageData {
    userId?: string;
    authToken?: string;
    wildness?: number;
    seenIds?: string[];
}

// Initialize context menus when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    console.log('Stumbleable extension installed');

    // Create context menu items
    chrome.contextMenus.create({
        id: 'submit-page',
        title: 'Submit to Stumbleable',
        contexts: ['page', 'link']
    });

    chrome.contextMenus.create({
        id: 'save-page',
        title: 'Save to Stumbleable',
        contexts: ['page', 'link']
    });

    chrome.contextMenus.create({
        id: 'separator',
        type: 'separator',
        contexts: ['page', 'link']
    });

    chrome.contextMenus.create({
        id: 'open-stumbleable',
        title: 'Open Stumbleable',
        contexts: ['page', 'link']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'submit-page':
            handleSubmitPage(info, tab);
            break;
        case 'save-page':
            handleSavePage(info, tab);
            break;
        case 'open-stumbleable':
            chrome.tabs.create({ url: `${API_BASE_URL}/stumble` });
            break;
    }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
    switch (command) {
        case 'stumble':
            handleStumbleCommand();
            break;
        case 'save-current':
            handleSaveCurrentCommand();
            break;
        case 'submit-current':
            handleSubmitCurrentCommand();
            break;
    }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getNextDiscovery':
            handleGetNextDiscovery(request.data).then(sendResponse);
            return true; // Keep channel open for async response
        case 'recordFeedback':
            handleRecordFeedback(request.data).then(sendResponse);
            return true;
        case 'saveContent':
            handleSaveContent(request.data).then(sendResponse);
            return true;
        case 'submitContent':
            handleSubmitContent(request.data).then(sendResponse);
            return true;
        case 'updateWildness':
            handleUpdateWildness(request.data).then(sendResponse);
            return true;
        case 'getUserData':
            handleGetUserData().then(sendResponse);
            return true;
    }
});

// Command handlers
async function handleStumbleCommand() {
    chrome.tabs.create({ url: `${API_BASE_URL}/stumble` });
}

async function handleSaveCurrentCommand() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.title) {
        await handleSaveContent({
            url: tab.url,
            title: tab.title
        });
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Saved!',
            message: `"${tab.title}" saved to Stumbleable`,
            priority: 1
        });
    }
}

async function handleSubmitCurrentCommand() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.title) {
        await handleSubmitContent({
            url: tab.url,
            title: tab.title
        });
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Submitted!',
            message: `"${tab.title}" submitted to Stumbleable`,
            priority: 1
        });
    }
}

// Context menu handlers
async function handleSubmitPage(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    const url = info.linkUrl || info.pageUrl || tab?.url;
    const title = tab?.title || 'Untitled';

    if (url) {
        await handleSubmitContent({ url, title });
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Submitted!',
            message: `"${title}" submitted to Stumbleable`,
            priority: 1
        });
    }
}

async function handleSavePage(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    const url = info.linkUrl || info.pageUrl || tab?.url;
    const title = tab?.title || 'Untitled';

    if (url) {
        await handleSaveContent({ url, title });
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Saved!',
            message: `"${title}" saved to Stumbleable`,
            priority: 1
        });
    }
}

// API handlers
async function handleGetNextDiscovery(data: { wildness?: number }): Promise<any> {
    try {
        const storage = await chrome.storage.sync.get(['userId', 'authToken', 'wildness', 'seenIds']) as StorageData;
        const wildness = data.wildness ?? storage.wildness ?? 50;
        const seenIds = storage.seenIds || [];

        const response = await fetch(`${DISCOVERY_API_URL}/api/next`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(storage.authToken && { 'Authorization': `Bearer ${storage.authToken}` })
            },
            body: JSON.stringify({
                userId: storage.userId,
                wildness,
                seenIds
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch discovery');
        }

        const discovery = await response.json();

        // Update seen IDs
        const updatedSeenIds = [...seenIds, discovery.id].slice(-100); // Keep last 100
        await chrome.storage.sync.set({ seenIds: updatedSeenIds });

        return { success: true, discovery };
    } catch (error) {
        console.error('Error fetching discovery:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

async function handleRecordFeedback(data: { discoveryId: string; feedback: string }): Promise<any> {
    try {
        const storage = await chrome.storage.sync.get(['userId', 'authToken']) as StorageData;

        const response = await fetch(`${INTERACTION_API_URL}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(storage.authToken && { 'Authorization': `Bearer ${storage.authToken}` })
            },
            body: JSON.stringify({
                userId: storage.userId,
                discoveryId: data.discoveryId,
                feedback: data.feedback
            })
        });

        if (!response.ok) {
            throw new Error('Failed to record feedback');
        }

        return { success: true };
    } catch (error) {
        console.error('Error recording feedback:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

async function handleSaveContent(data: { url: string; title: string }): Promise<any> {
    try {
        const storage = await chrome.storage.sync.get(['userId', 'authToken']) as StorageData;

        if (!storage.userId) {
            throw new Error('Not logged in');
        }

        // First, check if content exists or create it
        const submitResponse = await fetch(`${DISCOVERY_API_URL}/api/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(storage.authToken && { 'Authorization': `Bearer ${storage.authToken}` })
            },
            body: JSON.stringify({
                url: data.url,
                title: data.title,
                userId: storage.userId
            })
        });

        const submitResult = await submitResponse.json();
        const contentId = submitResult.id || submitResult.contentId;

        // Then save it
        const response = await fetch(`${INTERACTION_API_URL}/api/saved`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(storage.authToken && { 'Authorization': `Bearer ${storage.authToken}` })
            },
            body: JSON.stringify({
                userId: storage.userId,
                contentId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save content');
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving content:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

async function handleSubmitContent(data: { url: string; title: string }): Promise<any> {
    try {
        const storage = await chrome.storage.sync.get(['userId', 'authToken']) as StorageData;

        const response = await fetch(`${DISCOVERY_API_URL}/api/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(storage.authToken && { 'Authorization': `Bearer ${storage.authToken}` })
            },
            body: JSON.stringify({
                url: data.url,
                title: data.title,
                userId: storage.userId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit content');
        }

        return { success: true };
    } catch (error) {
        console.error('Error submitting content:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

async function handleUpdateWildness(data: { wildness: number }): Promise<any> {
    try {
        await chrome.storage.sync.set({ wildness: data.wildness });

        const storage = await chrome.storage.sync.get(['userId', 'authToken']) as StorageData;

        if (storage.userId) {
            const response = await fetch(`${USER_API_URL}/api/users/${storage.userId}/preferences`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(storage.authToken && { 'Authorization': `Bearer ${storage.authToken}` })
                },
                body: JSON.stringify({
                    wildness: data.wildness
                })
            });

            if (!response.ok) {
                console.warn('Failed to sync wildness to server');
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating wildness:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

async function handleGetUserData(): Promise<any> {
    try {
        const storage = await chrome.storage.sync.get(['userId', 'authToken', 'wildness']) as StorageData;
        return { success: true, data: storage };
    } catch (error) {
        console.error('Error getting user data:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
