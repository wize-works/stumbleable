/**
 * User service types
 */

export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
    id: string; // Clerk user ID
    preferredTopics: string[];
    wildness: number; // 0-100 exploration level
    role: UserRole; // User's role for RBAC
    createdAt?: string;
    updatedAt?: string;
}

export interface Topic {
    id: string;
    name: string;
    description?: string;
    category?: string;
}

export interface UserPreferences {
    preferredTopics: string[];
    wildness: number;
}

export interface CreateUserRequest {
    userId: string;
    preferences?: Partial<UserPreferences>;
}

export interface UpdatePreferencesRequest {
    preferredTopics?: string[];
    wildness?: number;
}

export interface UserResponse {
    user: User;
}

export interface TopicsResponse {
    topics: Topic[];
}

export interface RoleCheckResponse {
    userId: string;
    role: UserRole;
    hasAccess: boolean;
}

export interface UpdateRoleRequest {
    role: UserRole;
}