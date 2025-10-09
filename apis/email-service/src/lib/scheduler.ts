import cron from 'node-cron';
import type { Discovery } from '../types.js';
import { EmailQueue } from './queue.js';
import { supabase } from './supabase.js';

const DISCOVERY_SERVICE_URL = process.env.DISCOVERY_SERVICE_URL || 'http://localhost:7001';

/**
 * Scheduled Job Interface
 */
export interface ScheduledJob {
    name: string;
    displayName: string;
    description: string;
    cronExpression: string;
    enabled: boolean;
    jobType: 'email' | 'cleanup' | 'analytics';
    handler: (context: JobContext) => Promise<JobResult>;
    config?: Record<string, any>;
}

export interface JobContext {
    jobName: string;
    config: Record<string, any>;
    executionId: string;
    triggeredBy: 'scheduler' | 'manual';
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
 * Email Scheduler
 * Handles scheduled email jobs with cron management and execution tracking
 */
export class EmailScheduler {
    private jobs: Map<string, ScheduledJob> = new Map();
    private tasks: Map<string, cron.ScheduledTask> = new Map();
    private isInitialized: boolean = false;
    /**
     * Send weekly trending discoveries email to all opted-in users
     */
    static async sendWeeklyTrending(): Promise<void> {
        console.log('📊 Starting weekly trending email job...');

        try {
            // Get top 5 trending discoveries from past 7 days
            const discoveries = await this.getTrendingDiscoveries();

            if (discoveries.length === 0) {
                console.log('⚠️  No trending discoveries found');
                return;
            }

            // Get all users who opted in to weekly trending emails
            const { data: users, error } = await supabase
                .from('email_preferences')
                .select('user_id')
                .eq('weekly_trending', true)
                .eq('unsubscribed_all', false);

            if (error) {
                console.error('Failed to fetch opted-in users:', error);
                return;
            }

            if (!users || users.length === 0) {
                console.log('⚠️  No users opted in to weekly trending emails');
                return;
            }

            console.log(`📧 Queuing weekly trending emails for ${users.length} users...`);

            // Get week date range
            const weekEnd = new Date();
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);

            // Queue emails for all users
            let queued = 0;
            for (const user of users) {
                // Get user email
                const { data: userData } = await supabase
                    .from('users')
                    .select('email')
                    .eq('id', user.user_id)
                    .single();

                if (!userData?.email) continue;

                try {
                    await EmailQueue.enqueue(
                        user.user_id,
                        'weekly-trending',
                        userData.email,
                        {
                            discoveries,
                            weekStart: weekStart.toISOString(),
                            weekEnd: weekEnd.toISOString(),
                        }
                    );
                    queued++;
                } catch (error) {
                    console.error(`Failed to queue email for user ${user.user_id}:`, error);
                }
            }

            console.log(`✅ Queued ${queued} weekly trending emails`);
        } catch (error) {
            console.error('❌ Weekly trending job failed:', error);
        }
    }

    /**
     * Send weekly new discoveries email to all opted-in users
     */
    static async sendWeeklyNew(): Promise<void> {
        console.log('✨ Starting weekly new discoveries email job...');

        try {
            // Get 5 newest discoveries from past 7 days
            const discoveries = await this.getNewDiscoveries();

            if (discoveries.length === 0) {
                console.log('⚠️  No new discoveries found');
                return;
            }

            // Get all users who opted in to weekly new emails
            const { data: users, error } = await supabase
                .from('email_preferences')
                .select('user_id')
                .eq('weekly_new', true)
                .eq('unsubscribed_all', false);

            if (error) {
                console.error('Failed to fetch opted-in users:', error);
                return;
            }

            if (!users || users.length === 0) {
                console.log('⚠️  No users opted in to weekly new emails');
                return;
            }

            console.log(`📧 Queuing weekly new emails for ${users.length} users...`);

            // Get week date range
            const weekEnd = new Date();
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);

            // Queue emails for all users
            let queued = 0;
            for (const user of users) {
                // Get user email
                const { data: userData } = await supabase
                    .from('users')
                    .select('email')
                    .eq('id', user.user_id)
                    .single();

                if (!userData?.email) continue;

                try {
                    await EmailQueue.enqueue(
                        user.user_id,
                        'weekly-new',
                        userData.email,
                        {
                            discoveries,
                            weekStart: weekStart.toISOString(),
                            weekEnd: weekEnd.toISOString(),
                        }
                    );
                    queued++;
                } catch (error) {
                    console.error(`Failed to queue email for user ${user.user_id}:`, error);
                }
            }

            console.log(`✅ Queued ${queued} weekly new emails`);
        } catch (error) {
            console.error('❌ Weekly new job failed:', error);
        }
    }

    /**
     * Get top trending discoveries from past 7 days
     */
    private static async getTrendingDiscoveries(): Promise<Discovery[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Query discoveries with engagement metrics
        const { data, error } = await supabase
            .from('discoveries')
            .select('id, url, title, description, image_url, domain, topics')
            .gte('created_at', sevenDaysAgo.toISOString())
            .eq('status', 'approved')
            .is('deleted_at', null)
            .order('like_count', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Failed to fetch trending discoveries:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get newest discoveries from past 7 days
     */
    private static async getNewDiscoveries(): Promise<Discovery[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('discoveries')
            .select('id, url, title, description, image_url, domain, topics')
            .gte('approved_at', sevenDaysAgo.toISOString())
            .eq('status', 'approved')
            .is('deleted_at', null)
            .order('approved_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Failed to fetch new discoveries:', error);
            return [];
        }

        return data || [];
    }

    /**
     * ===== CRON SCHEDULER MANAGEMENT =====
     */

    /**
     * Register a scheduled job with cron
     */
    registerJob(job: ScheduledJob): void {
        console.log(`📋 Registering job: ${job.name} (${job.displayName})`);
        this.jobs.set(job.name, job);

        // Validate cron expression
        if (!cron.validate(job.cronExpression)) {
            console.error(`❌ Invalid cron expression for job ${job.name}: ${job.cronExpression}`);
            return;
        }

        console.log(`✓ Job registered: ${job.name} - ${job.cronExpression}`);
    }

    /**
     * Initialize scheduler and start all enabled jobs
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('⚠️  Scheduler already initialized');
            return;
        }

        console.log('🚀 Initializing email scheduler...');

        // Load job configurations from database
        await this.loadJobConfigurations();

        // Register built-in jobs
        this.registerBuiltInJobs();

        // Start cron tasks for enabled jobs
        for (const [jobName, job] of this.jobs.entries()) {
            if (job.enabled) {
                this.startJob(jobName);
            } else {
                console.log(`⏸️  Job ${jobName} is disabled, skipping`);
            }
        }

        this.isInitialized = true;
        console.log(`✅ Scheduler initialized with ${this.jobs.size} jobs`);
    }

    /**
     * Register built-in email jobs
     */
    private registerBuiltInJobs(): void {
        // Weekly Digest Job
        this.registerJob({
            name: 'weekly-digest',
            displayName: 'Weekly Digest',
            description: 'Send weekly trending content digest to opted-in users',
            cronExpression: '0 9 * * 1', // 9 AM every Monday
            enabled: true,
            jobType: 'email',
            handler: async (context) => {
                await EmailScheduler.sendWeeklyTrending();
                return { success: true, itemsProcessed: 0, itemsSucceeded: 0, itemsFailed: 0 };
            },
        });

        // Re-engagement Job
        this.registerJob({
            name: 're-engagement',
            displayName: 'Re-engagement Emails',
            description: 'Send personalized emails to inactive users (7+ days)',
            cronExpression: '0 10 * * *', // 10 AM every day
            enabled: true,
            jobType: 'email',
            handler: async (context) => {
                // TODO: Implement re-engagement email logic
                return { success: true, itemsProcessed: 0, itemsSucceeded: 0, itemsFailed: 0 };
            },
        });

        // Queue Cleanup Job
        this.registerJob({
            name: 'queue-cleanup',
            displayName: 'Email Queue Cleanup',
            description: 'Remove old processed emails from queue',
            cronExpression: '0 2 * * *', // 2 AM every day
            enabled: true,
            jobType: 'cleanup',
            handler: async (context) => {
                const retentionDays = context.config.retentionDays || 30;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

                const { error, count } = await supabase
                    .from('email_queue')
                    .delete()
                    .eq('status', 'sent')
                    .lt('sent_at', cutoffDate.toISOString());

                if (error) {
                    return {
                        success: false,
                        itemsProcessed: 0,
                        itemsSucceeded: 0,
                        itemsFailed: 0,
                        error: error.message,
                    };
                }

                return {
                    success: true,
                    itemsProcessed: count || 0,
                    itemsSucceeded: count || 0,
                    itemsFailed: 0,
                    metadata: { retentionDays, cutoffDate: cutoffDate.toISOString() },
                };
            },
        });
    }

    /**
     * Load job configurations from database
     */
    private async loadJobConfigurations(): Promise<void> {
        try {
            const { data: configs, error } = await supabase
                .from('job_schedules')
                .select('*');

            if (error) {
                console.error('Failed to load job configurations:', error);
                return;
            }

            if (!configs || configs.length === 0) {
                console.log('No job configurations found in database');
                return;
            }

            // Update registered jobs with database config
            for (const config of configs) {
                const job = this.jobs.get(config.job_name);
                if (job) {
                    job.enabled = config.enabled;
                    job.cronExpression = config.cron_expression;
                    job.config = config.config || {};
                    console.log(`📝 Loaded config for ${config.job_name}: ${config.cron_expression} (${config.enabled ? 'enabled' : 'disabled'})`);
                }
            }
        } catch (error) {
            console.error('Error loading job configurations:', error);
        }
    }

    /**
     * Start a specific job
     */
    private startJob(jobName: string): void {
        const job = this.jobs.get(jobName);
        if (!job) {
            console.error(`Job ${jobName} not found`);
            return;
        }

        // Stop existing task if running
        if (this.tasks.has(jobName)) {
            this.stopJob(jobName);
        }

        try {
            const task = cron.schedule(
                job.cronExpression,
                () => {
                    this.executeJob(jobName, 'scheduler').catch((error) => {
                        console.error(`Error executing scheduled job ${jobName}:`, error);
                    });
                },
                {
                    scheduled: true,
                    timezone: 'UTC',
                }
            );

            this.tasks.set(jobName, task);
            console.log(`▶️  Started job: ${jobName} (${job.cronExpression})`);
        } catch (error) {
            console.error(`Failed to start job ${jobName}:`, error);
        }
    }

    /**
     * Stop a specific job
     */
    private stopJob(jobName: string): void {
        const task = this.tasks.get(jobName);
        if (task) {
            task.stop();
            this.tasks.delete(jobName);
            console.log(`⏹️  Stopped job: ${jobName}`);
        }
    }

    /**
     * Execute a job (can be called manually or by scheduler)
     */
    async executeJob(
        jobName: string,
        triggeredBy: 'scheduler' | 'manual' = 'scheduler',
        triggeredByUser?: string
    ): Promise<JobResult> {
        const job = this.jobs.get(jobName);
        if (!job) {
            throw new Error(`Job ${jobName} not found`);
        }

        console.log(`\n🔄 Starting job execution: ${job.displayName}`);
        const startTime = Date.now();

        // Create execution record
        const executionId = await this.createExecutionRecord(jobName, job.jobType, triggeredBy, triggeredByUser);

        const context: JobContext = {
            jobName,
            config: job.config || {},
            executionId,
            triggeredBy,
            triggeredByUser,
        };

        try {
            // Execute the job handler
            const result = await job.handler(context);

            // Calculate duration
            const duration = Date.now() - startTime;

            // Update execution record with success
            await this.updateExecutionRecord(executionId, {
                status: 'completed',
                duration_ms: duration,
                items_processed: result.itemsProcessed,
                items_succeeded: result.itemsSucceeded,
                items_failed: result.itemsFailed,
                metadata: result.metadata,
            });

            console.log(`✅ Job completed: ${job.displayName}`);
            console.log(`   Duration: ${duration}ms`);
            console.log(`   Processed: ${result.itemsProcessed}, Succeeded: ${result.itemsSucceeded}, Failed: ${result.itemsFailed}`);

            return result;
        } catch (error: any) {
            const duration = Date.now() - startTime;

            // Update execution record with failure
            await this.updateExecutionRecord(executionId, {
                status: 'failed',
                duration_ms: duration,
                error_message: error.message || 'Unknown error',
            });

            console.error(`❌ Job failed: ${job.displayName}`);
            console.error(`   Error: ${error.message}`);

            return {
                success: false,
                itemsProcessed: 0,
                itemsSucceeded: 0,
                itemsFailed: 0,
                error: error.message,
            };
        }
    }

    /**
     * Create execution record in database
     */
    private async createExecutionRecord(
        jobName: string,
        jobType: string,
        triggeredBy: string,
        triggeredByUser?: string
    ): Promise<string> {
        const { data, error } = await supabase
            .from('scheduled_jobs')
            .insert({
                job_name: jobName,
                job_type: jobType,
                status: 'running',
                triggered_by: triggeredBy,
                triggered_by_user: triggeredByUser || null,
            })
            .select('id')
            .single();

        if (error || !data) {
            console.error('Failed to create execution record:', error);
            throw new Error('Failed to create execution record');
        }

        return data.id;
    }

    /**
     * Update execution record with results
     */
    private async updateExecutionRecord(
        executionId: string,
        updates: {
            status: 'completed' | 'failed';
            duration_ms: number;
            items_processed?: number;
            items_succeeded?: number;
            items_failed?: number;
            error_message?: string;
            metadata?: Record<string, any>;
        }
    ): Promise<void> {
        const { error } = await supabase
            .from('scheduled_jobs')
            .update({
                ...updates,
                completed_at: new Date().toISOString(),
            })
            .eq('id', executionId);

        if (error) {
            console.error('Failed to update execution record:', error);
        }
    }

    /**
     * Enable a job
     */
    async enableJob(jobName: string): Promise<void> {
        const job = this.jobs.get(jobName);
        if (!job) {
            throw new Error(`Job ${jobName} not found`);
        }

        job.enabled = true;

        // Update database
        await supabase
            .from('job_schedules')
            .update({ enabled: true, updated_at: new Date().toISOString() })
            .eq('job_name', jobName);

        // Start the job
        this.startJob(jobName);

        console.log(`✅ Enabled job: ${jobName}`);
    }

    /**
     * Disable a job
     */
    async disableJob(jobName: string): Promise<void> {
        const job = this.jobs.get(jobName);
        if (!job) {
            throw new Error(`Job ${jobName} not found`);
        }

        job.enabled = false;

        // Update database
        await supabase
            .from('job_schedules')
            .update({ enabled: false, updated_at: new Date().toISOString() })
            .eq('job_name', jobName);

        // Stop the job
        this.stopJob(jobName);

        console.log(`⏸️  Disabled job: ${jobName}`);
    }

    /**
     * Get all registered jobs with their status
     */
    getJobs(): Array<ScheduledJob & { isRunning: boolean }> {
        return Array.from(this.jobs.values()).map((job) => ({
            ...job,
            isRunning: this.tasks.has(job.name),
        }));
    }

    /**
     * Get job status from database
     */
    async getJobStatus(jobName: string): Promise<any> {
        const { data, error } = await supabase
            .from('job_schedules')
            .select('*')
            .eq('job_name', jobName)
            .single();

        if (error) {
            throw new Error(`Failed to get job status: ${error.message}`);
        }

        return data;
    }

    /**
     * Shutdown scheduler and stop all jobs
     */
    shutdown(): void {
        console.log('🛑 Shutting down scheduler...');

        for (const [jobName] of this.tasks.entries()) {
            this.stopJob(jobName);
        }

        this.isInitialized = false;
        console.log('✅ Scheduler shut down');
    }
}

// Export singleton instance
export const scheduler = new EmailScheduler();

