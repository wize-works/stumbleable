// Popup script for Stumbleable Chrome Extension
// Handles the popup UI and user interactions

interface Discovery {
    id: string;
    url: string;
    title: string;
    description?: string;
    image_url?: string;
    domain: string;
    topics?: string[];
    rationale?: string;
}

interface UserData {
    userId?: string;
    authToken?: string;
    wildness?: number;
}

let currentDiscovery: Discovery | null = null;
let userData: UserData = {};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
    setupEventListeners();
    setupKeyboardShortcuts();

    if (userData.userId) {
        await loadNextDiscovery();
    } else {
        showLoginPrompt();
    }
});

// Load user data from storage
async function loadUserData() {
    const response = await chrome.runtime.sendMessage({ action: 'getUserData' });
    if (response.success) {
        userData = response.data;

        // Update wildness slider
        const wildnessSlider = document.getElementById('wildness-slider') as HTMLInputElement;
        const wildnessValue = document.getElementById('wildness-value') as HTMLElement;
        if (wildnessSlider && wildnessValue) {
            wildnessSlider.value = String(userData.wildness || 50);
            wildnessValue.textContent = String(userData.wildness || 50);
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Stumble button
    const stumbleBtn = document.getElementById('stumble-btn');
    stumbleBtn?.addEventListener('click', handleStumble);

    // Action buttons
    document.getElementById('like-btn')?.addEventListener('click', () => handleFeedback('up'));
    document.getElementById('skip-btn')?.addEventListener('click', () => handleFeedback('skip'));
    document.getElementById('save-btn')?.addEventListener('click', handleSave);
    document.getElementById('visit-btn')?.addEventListener('click', handleVisit);

    // Wildness slider
    const wildnessSlider = document.getElementById('wildness-slider') as HTMLInputElement;
    wildnessSlider?.addEventListener('input', handleWildnessChange);

    // Footer links
    document.getElementById('submit-current')?.addEventListener('click', handleSubmitCurrent);
    document.getElementById('save-current')?.addEventListener('click', handleSaveCurrent);

    // Login button
    document.getElementById('login-btn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:3000/sign-in' });
    });

    // Retry button
    document.getElementById('retry-btn')?.addEventListener('click', handleStumble);
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLInputElement) return; // Ignore when typing in inputs

        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                handleStumble();
                break;
            case 'ArrowUp':
                e.preventDefault();
                handleFeedback('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                handleFeedback('skip');
                break;
            case 's':
            case 'S':
                e.preventDefault();
                handleSave();
                break;
            case 'v':
            case 'V':
                e.preventDefault();
                handleVisit();
                break;
        }
    });
}

// Handle stumble action
async function handleStumble() {
    if (currentDiscovery) {
        await handleFeedback('next');
    } else {
        await loadNextDiscovery();
    }
}

// Load next discovery
async function loadNextDiscovery() {
    showLoading();

    const response = await chrome.runtime.sendMessage({
        action: 'getNextDiscovery',
        data: { wildness: userData.wildness }
    });

    if (response.success) {
        currentDiscovery = response.discovery;
        if (currentDiscovery) {
            displayDiscovery(currentDiscovery);
        }
    } else {
        showError(response.error || 'Failed to load discovery');
    }
}

// Display discovery in UI
function displayDiscovery(discovery: Discovery) {
    hideAll();

    const card = document.getElementById('discovery-card');
    if (!card) return;

    // Update image
    const img = document.getElementById('card-img') as HTMLImageElement;
    if (img) {
        img.src = discovery.image_url || 'icons/placeholder.png';
        img.alt = discovery.title;
    }

    // Update domain
    const domain = document.getElementById('card-domain');
    if (domain) {
        domain.textContent = discovery.domain;
    }

    // Update title
    const title = document.getElementById('card-title');
    if (title) {
        title.textContent = discovery.title;
    }

    // Update description
    const description = document.getElementById('card-description');
    if (description) {
        description.textContent = discovery.description || '';
    }

    // Update topics
    const topicsContainer = document.getElementById('card-topics');
    if (topicsContainer && discovery.topics) {
        topicsContainer.innerHTML = '';
        discovery.topics.slice(0, 3).forEach(topic => {
            const chip = document.createElement('span');
            chip.className = 'topic-chip';
            chip.textContent = topic;
            topicsContainer.appendChild(chip);
        });
    }

    card.classList.remove('hidden');
}

// Handle feedback
async function handleFeedback(feedback: string) {
    if (!currentDiscovery) return;

    const response = await chrome.runtime.sendMessage({
        action: 'recordFeedback',
        data: {
            discoveryId: currentDiscovery.id,
            feedback
        }
    });

    if (response.success) {
        // Load next discovery
        await loadNextDiscovery();
    }
}

// Handle save
async function handleSave() {
    if (!currentDiscovery) return;

    showLoading();

    const response = await chrome.runtime.sendMessage({
        action: 'saveContent',
        data: {
            url: currentDiscovery.url,
            title: currentDiscovery.title
        }
    });

    if (response.success) {
        showSuccess('Saved!');
        setTimeout(() => {
            displayDiscovery(currentDiscovery!);
        }, 1000);
    } else {
        showError('Failed to save');
    }
}

// Handle visit
function handleVisit() {
    if (!currentDiscovery) return;
    chrome.tabs.create({ url: currentDiscovery.url });
}

// Handle wildness change
async function handleWildnessChange(e: Event) {
    const slider = e.target as HTMLInputElement;
    const value = parseInt(slider.value);

    const wildnessValue = document.getElementById('wildness-value');
    if (wildnessValue) {
        wildnessValue.textContent = String(value);
    }

    // Update storage and sync with server
    await chrome.runtime.sendMessage({
        action: 'updateWildness',
        data: { wildness: value }
    });

    userData.wildness = value;
}

// Handle submit current page
async function handleSubmitCurrent(e: Event) {
    e.preventDefault();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.title) return;

    showLoading();

    const response = await chrome.runtime.sendMessage({
        action: 'submitContent',
        data: {
            url: tab.url,
            title: tab.title
        }
    });

    if (response.success) {
        showSuccess('Submitted!');
        setTimeout(() => {
            if (currentDiscovery) {
                displayDiscovery(currentDiscovery);
            } else {
                hideAll();
            }
        }, 1000);
    } else {
        showError('Failed to submit');
    }
}

// Handle save current page
async function handleSaveCurrent(e: Event) {
    e.preventDefault();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.title) return;

    showLoading();

    const response = await chrome.runtime.sendMessage({
        action: 'saveContent',
        data: {
            url: tab.url,
            title: tab.title
        }
    });

    if (response.success) {
        showSuccess('Saved!');
        setTimeout(() => {
            if (currentDiscovery) {
                displayDiscovery(currentDiscovery);
            } else {
                hideAll();
            }
        }, 1000);
    } else {
        showError('Failed to save');
    }
}

// UI State Helpers
function showLoading() {
    hideAll();
    document.getElementById('loading')?.classList.remove('hidden');
}

function showError(message: string) {
    hideAll();
    const error = document.getElementById('error');
    const errorMessage = document.querySelector('.error-message');
    if (error && errorMessage) {
        errorMessage.textContent = message;
        error.classList.remove('hidden');
    }
}

function showSuccess(message: string) {
    hideAll();
    const loading = document.getElementById('loading');
    if (loading) {
        loading.querySelector('p')!.textContent = message;
        loading.classList.remove('hidden');
    }
}

function showLoginPrompt() {
    hideAll();
    document.getElementById('login-prompt')?.classList.remove('hidden');
}

function hideAll() {
    document.getElementById('loading')?.classList.add('hidden');
    document.getElementById('error')?.classList.add('hidden');
    document.getElementById('login-prompt')?.classList.add('hidden');
    document.getElementById('discovery-card')?.classList.add('hidden');
}
