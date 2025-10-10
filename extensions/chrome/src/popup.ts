// Popup script for Stumbleable Chrome Extension
// Simplified: Focus on quick actions, not loading discoveries

interface UserData {
    userId?: string;
    authToken?: string;
    email?: string;
    username?: string;
}

let userData: UserData = {};
let currentTab: chrome.tabs.Tab | null = null;

const PORTAL_URL = 'http://localhost:3000';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentTab();
    await loadUserData();
    setupEventListeners();
    setupAuthListener();

    if (userData.userId) {
        showMainContent();
        await loadUserStats();
        await checkPageStatus();
    } else {
        showLoginPrompt();
    }
});

// Load current active tab
async function loadCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab || null;
}

// Listen for auth state changes
function setupAuthListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'authStateChanged') {
            console.log('Auth state changed, reloading popup...');
            loadUserData().then(() => {
                if (userData.userId) {
                    showMainContent();
                    loadUserStats();
                    checkPageStatus();
                }
            });
        }
    });
}

// Load user data from storage
async function loadUserData() {
    const response = await chrome.runtime.sendMessage({ action: 'getUserData' });
    if (response.success) {
        userData = response.data;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Primary action - Open stumble page
    document.getElementById('stumble-btn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: `${PORTAL_URL}/stumble` });
    });

    // Quick actions
    document.getElementById('submit-current')?.addEventListener('click', handleSubmitCurrent);
    document.getElementById('save-current')?.addEventListener('click', handleSaveCurrent);

    // Secondary links
    document.getElementById('open-saved')?.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: `${PORTAL_URL}/saved` });
    });

    document.getElementById('open-dashboard')?.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: `${PORTAL_URL}/dashboard` });
    });

    document.getElementById('open-settings')?.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: `${PORTAL_URL}/dashboard/preferences` });
    });

    // Login button
    document.getElementById('login-btn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: `${PORTAL_URL}/extension-auth` });
    });

    // Sign out button
    document.getElementById('sign-out')?.addEventListener('click', handleSignOut);

    // Keyboard shortcuts help
    document.getElementById('shortcuts-help')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('shortcuts-modal')?.classList.remove('hidden');
    });

    document.getElementById('close-modal')?.addEventListener('click', () => {
        document.getElementById('shortcuts-modal')?.classList.add('hidden');
    });

    // About link
    document.getElementById('about-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: `${PORTAL_URL}/about` });
    });
}

// Submit current page
async function handleSubmitCurrent() {
    if (!currentTab?.url || !userData.userId) {
        showToast('Please sign in to submit content', 'error');
        return;
    }

    // Validate URL
    if (!currentTab.url.startsWith('http://') && !currentTab.url.startsWith('https://')) {
        showToast('Cannot submit browser pages (must be http:// or https://)', 'error');
        return;
    }

    showLoading('Submitting page...');

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'submitContent',
            data: {
                url: currentTab.url,
                title: currentTab.title || 'Untitled'
            }
        });

        hideLoading();

        if (response.success) {
            if (response.status === 'pending_review') {
                showToast('Submitted for review! 🎉', 'success');
            } else {
                showToast('Page submitted successfully! 🎉', 'success');
            }
            await loadUserStats(); // Refresh stats
        } else {
            showToast(response.error || 'Failed to submit page', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Submit error:', error);
        showToast('Failed to submit page', 'error');
    }
}

// Save current page
async function handleSaveCurrent() {
    if (!currentTab?.url || !userData.userId) {
        showToast('Please sign in to save content', 'error');
        return;
    }

    showLoading('Saving page...');

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'saveContent',
            data: {
                url: currentTab.url,
                title: currentTab.title
            }
        });

        hideLoading();

        if (response.success) {
            showToast('Page saved successfully!', 'success');
            await loadUserStats(); // Refresh stats
        } else {
            showToast(response.error || 'Failed to save page', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Failed to save page', 'error');
    }
}

// Sign out
async function handleSignOut() {
    showLoading('Signing out...');

    const response = await chrome.runtime.sendMessage({ action: 'signOut' });

    hideLoading();

    if (response.success) {
        userData = {};
        showLoginPrompt();
        showToast('Signed out successfully', 'success');
    }
}

// Load user stats
async function loadUserStats() {
    const savedCountEl = document.getElementById('saved-count');
    const submittedCountEl = document.getElementById('submitted-count');

    // Show loading state
    if (savedCountEl) savedCountEl.textContent = '...';
    if (submittedCountEl) submittedCountEl.textContent = '...';

    try {
        const response = await chrome.runtime.sendMessage({ action: 'getUserStats' });

        if (response.success && response.data) {
            if (savedCountEl) {
                savedCountEl.textContent = response.data.savedCount.toString();
            }
            if (submittedCountEl) {
                submittedCountEl.textContent = response.data.submittedCount.toString();
            }
        } else {
            // On error, show 0 instead of ...
            if (savedCountEl) savedCountEl.textContent = '0';
            if (submittedCountEl) submittedCountEl.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
        // On error, show 0 instead of ...
        if (savedCountEl) savedCountEl.textContent = '0';
        if (submittedCountEl) submittedCountEl.textContent = '0';
    }
}

// Check if current page is already in Stumbleable
async function checkPageStatus() {
    if (!currentTab?.url) return;

    // TODO: Implement API call to check if page exists in Stumbleable
    // const response = await chrome.runtime.sendMessage({ 
    //     action: 'checkPageStatus',
    //     data: { url: currentTab.url }
    // });
    // 
    // if (response.success && response.data.exists) {
    //     const statusDiv = document.getElementById('page-status');
    //     const statusMsg = document.getElementById('page-status-message');
    //     if (statusDiv && statusMsg) {
    //         statusMsg.textContent = 'This page is already in Stumbleable';
    //         statusDiv.classList.remove('hidden');
    //     }
    // }
}

// UI State Management
function showMainContent() {
    hideAll();
    document.getElementById('main-content')?.classList.remove('hidden');
    document.getElementById('user-badge')?.classList.remove('hidden');
    document.getElementById('sign-out')?.classList.remove('hidden');
}

function showLoginPrompt() {
    hideAll();
    document.getElementById('login-prompt')?.classList.remove('hidden');
}

function showLoading(message: string = 'Loading...') {
    document.getElementById('loading-message')!.textContent = message;
    document.getElementById('loading')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading')?.classList.add('hidden');
}

function hideAll() {
    document.getElementById('login-prompt')?.classList.add('hidden');
    document.getElementById('main-content')?.classList.add('hidden');
    document.getElementById('loading')?.classList.add('hidden');
    document.getElementById('user-badge')?.classList.add('hidden');
    document.getElementById('sign-out')?.classList.add('hidden');
}

// Toast notifications
function showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon') as HTMLImageElement | null;
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastIcon || !toastMessage) return;

    toastMessage.textContent = message;

    if (type === 'success') {
        toastIcon.src = 'icons/check-circle.svg';
        toast.style.backgroundColor = 'var(--success-color, #10b981)';
    } else {
        toastIcon.src = 'icons/times-circle.svg';
        toast.style.backgroundColor = 'var(--error-color, #ef4444)';
    }

    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
