export type Interaction = {
    id: string;
    discoveryId: string;
    action: 'up' | 'down' | 'save' | 'unsave' | 'skip' | 'share' | 'view';
    at: number; // Date.now()
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
};

export type SavedDiscovery = {
    discoveryId: string;
    savedAt: number;
};