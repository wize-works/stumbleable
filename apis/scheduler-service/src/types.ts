/**
 * Job registration from external services
 */
export interface JobRegistration {
    name: string;
    displayName: string;
    description: string;
    cronExpression: string;
    enabled: boolean;
    jobType: 'email' | 'crawler' | 'cleanup' | 'analytics' | 'other';
    service: string; // Service name (e.g., 'email-service', 'crawler-service')
    endpoint: string; // HTTP endpoint to trigger (e.g., '/api/jobs/weekly-digest')
    config?: Record<string, any>;
}

/**
 * Internal scheduled job definition
 */
export interface ScheduledJob extends JobRegistration {
    serviceUrl: string; // Full URL to the service
}

export interface JobContext {
    jobName: string;
    config: Record<string, any>;
    executionId: string;
    triggeredBy: 'scheduler' | 'manual' | 'admin';
    triggeredByUser?: string;
}

export interface JobResult {
    success: boolean;
    itemsProcessed: number;
    itemsSucceeded: number;
    itemsFailed: number;
    error?: string;
    metadata?: Record<string, any>;
}

/**
 * Job execution record
 */
export interface JobExecution {
    id: string;
    job_name: string;
    job_type: string;
    status: 'running' | 'completed' | 'failed';
    started_at: string;
    completed_at: string | null;
    duration_ms: number | null;
    items_processed: number;
    items_succeeded: number;
    items_failed: number;
    error_message: string | null;
    metadata: Record<string, any> | null;
    triggered_by: string;
    triggered_by_user: string | null;
}

/**
 * Job schedule configuration
 */
export interface JobSchedule {
    job_name: string;
    display_name: string;
    description: string;
    cron_expression: string;
    enabled: boolean;
    job_type: string;
    service: string;
    endpoint: string;
    last_run_at: string | null;
    last_run_status: string | null;
    last_run_duration_ms: number | null;
    next_run_at: string | null;
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}
