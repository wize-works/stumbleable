export type Interaction = {
    id: string;
    discoveryId: string;
    action: 'up' | 'down' | 'save' | 'unsave' | 'skip' | 'unskip' | 'unlike' | 'share' | 'view';
    at: number; // Date.now()
    timeOnPage?: number; // Time spent on page in seconds
};

export type InteractionStats = {
    up: number;
    down: number;
    saved: boolean;
    shares: number;
};

export type FeedbackRequest = {
    discoveryId: string;
    action: Interaction['action'];
    timeOnPage?: number; // Optional time spent on page in seconds
};

export type SavedDiscovery = {
    discoveryId: string;
    savedAt: number;
};