// Background service worker for Stumbleable Chrome Extension
// Handles context menus, keyboard commands, and communication with the API

const BG_PORTAL_URL = 'http://localhost:3000'; // Will use production URL when deployed
const DISCOVERY_API_URL = 'http://localhost:7001';
const INTERACTION_API_URL = 'http://localhost:7002';
const USER_API_URL = 'http://localhost:7003';
const CRAWLER_API_URL = 'http://localhost:7004';

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
            chrome.tabs.create({ url: `${BG_PORTAL_URL}/stumble` });
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
        case 'handleAuthCallback':
            handleAuthCallback(request.data).then(sendResponse);
            return true; // Keep channel open for async response
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
        case 'getUserStats':
            handleGetUserStats().then(sendResponse);
            return true;
    }
});

// Command handlers
async function handleStumbleCommand() {
    chrome.tabs.create({ url: `${BG_PORTAL_URL}/stumble` });
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
async function handleAuthCallback(authData: any): Promise<any> {
    try {
        console.log('Background received auth callback:', authData);

        // Validate auth data
        if (!authData.userId || !authData.authToken) {
            throw new Error('Invalid auth data received');
        }

        // Store authentication data
        await chrome.storage.sync.set({
            userId: authData.userId,
            authToken: authData.authToken,
            email: authData.email,
            username: authData.username
        });

        // Fetch user preferences from server
        try {
            const response = await fetch(`${USER_API_URL}/api/users/${authData.userId}`, {
                headers: {
                    'Authorization': `Bearer ${authData.authToken}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                // Store wildness preference
                if (userData.wildness !== undefined) {
                    await chrome.storage.sync.set({ wildness: userData.wildness });
                }
            }
        } catch (error) {
            console.warn('Could not fetch user preferences:', error);
            // Continue anyway - we have auth
        }

        console.log('✅ Authentication stored successfully');

        // Show success notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Signed In!',
            message: 'You\'re now signed in to Stumbleable',
            priority: 2
        });

        // Notify any open popups to refresh
        chrome.runtime.sendMessage({ action: 'authStateChanged' }).catch(() => {
            // Ignore if no listeners
        });

        return { success: true };
    } catch (error) {
        console.error('Error handling auth callback:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

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
            return { success: false, error: 'Please sign in to save content' };
        }

        console.log('[Save] Saving content:', { url: data.url, title: data.title, userId: storage.userId });

        // First, ensure content exists in the system by submitting it
        const submitResponse = await fetch(`${CRAWLER_API_URL}/api/submit`, {
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
        console.log('[Save] Submit response:', submitResponse.status, submitResult);

        // Get the content ID from submission (handle both new and existing content)
        let contentId: string;
        if (submitResponse.status === 201) {
            // New content created
            contentId = submitResult.discovery?.id;
        } else if (submitResponse.status === 409) {
            // Content already exists
            contentId = submitResult.discovery?.id;
        } else if (submitResponse.status === 202) {
            // Content pending review - we can't save it yet
            return { success: false, error: 'Content is pending review. You can save it once it\'s approved.' };
        } else {
            throw new Error(submitResult.error || 'Failed to submit content');
        }

        if (!contentId) {
            throw new Error('No content ID returned from submission');
        }

        // Now record the save interaction
        const saveResponse = await fetch(`${INTERACTION_API_URL}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(storage.authToken && { 'Authorization': `Bearer ${storage.authToken}` })
            },
            body: JSON.stringify({
                discoveryId: contentId,
                action: 'save',
                userId: storage.userId
            })
        });

        const saveResult = await saveResponse.json();
        console.log('[Save] Feedback response:', saveResponse.status, saveResult);

        if (!saveResponse.ok) {
            throw new Error(saveResult.error || 'Failed to save content');
        }

        return { success: true, contentId };
    } catch (error) {
        console.error('Error saving content:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

async function handleSubmitContent(data: { url: string; title?: string }): Promise<any> {
    try {
        const storage = await chrome.storage.sync.get(['userId', 'authToken']) as StorageData;

        if (!storage.userId) {
            return { success: false, error: 'Please sign in to submit content' };
        }

        console.log('[Submit] Submitting content:', { url: data.url, title: data.title, userId: storage.userId });

        const response = await fetch(`${CRAWLER_API_URL}/api/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(storage.authToken && { 'Authorization': `Bearer ${storage.authToken}` })
            },
            body: JSON.stringify({
                url: data.url,
                title: data.title || 'Untitled',
                userId: storage.userId
            })
        });

        const responseData = await response.json();
        console.log('[Submit] API Response:', response.status, responseData);

        if (!response.ok) {
            // Handle specific error cases
            if (response.status === 400) {
                return { success: false, error: responseData.error || 'Invalid submission' };
            } else if (response.status === 409) {
                return { success: false, error: 'This page has already been submitted' };
            } else if (response.status === 202) {
                return { success: true, message: 'Submitted for review', status: 'pending_review' };
            }
            throw new Error(responseData.error || 'Failed to submit content');
        }

        return { success: true, data: responseData };
    } catch (error) {
        console.error('Error submitting content:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
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

/**
 * Get user statistics (saved count, submitted count)
 */
async function handleGetUserStats(): Promise<any> {
    try {
        const storage = await chrome.storage.sync.get(['userId', 'authToken']) as StorageData;

        if (!storage.userId || !storage.authToken) {
            return {
                success: false,
                error: 'User not authenticated'
            };
        }

        console.log('[Stats] Fetching user statistics...');

        // Fetch saved discoveries count from Interaction Service
        const savedResponse = await fetch(`${INTERACTION_API_URL}/api/saved`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${storage.authToken}`,
                'Content-Type': 'application/json',
            },
        });

        let savedCount = 0;
        if (savedResponse.ok) {
            const savedData = await savedResponse.json();
            savedCount = savedData.saved?.length || 0;
            console.log('[Stats] Saved count:', savedCount);
        } else {
            console.error('[Stats] Failed to fetch saved count:', savedResponse.status);
        }

        // For submitted count, we'll need to track this differently
        // For now, return 0 as placeholder - this would need a new endpoint
        const submittedCount = 0;

        return {
            success: true,
            data: {
                savedCount,
                submittedCount
            }
        };
    } catch (error) {
        console.error('[Stats] Error fetching user stats:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: {
                savedCount: 0,
                submittedCount: 0
            }
        };
    }
}
