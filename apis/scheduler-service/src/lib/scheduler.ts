import cron from 'node-cron';
import type { JobContext, JobResult, ScheduledJob } from '../types.js';
import { supabase } from './supabase.js';

/**
 * Centralized Scheduler Engine
 * Manages cron jobs across all services by triggering their HTTP endpoints
 */
export class Scheduler {
    private jobs: Map<string, ScheduledJob> = new Map();
    private tasks: Map<string, cron.ScheduledTask> = new Map();
    private isInitialized: boolean = false;

    /**
     * Initialize scheduler and load job configurations from database
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('⚠️  Scheduler already initialized');
            return;
        }

        console.log('🚀 Initializing scheduler service...');

        // Load job configurations from database
        await this.loadJobConfigurations();

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

            // Register jobs from database
            for (const config of configs) {
                const job: ScheduledJob = {
                    name: config.job_name,
                    displayName: config.display_name,
                    description: config.description,
                    cronExpression: config.cron_expression,
                    enabled: config.enabled,
                    jobType: config.job_type,
                    service: config.service,
                    endpoint: config.endpoint,
                    serviceUrl: this.getServiceUrl(config.service),
                    config: config.config || {},
                };

                this.jobs.set(job.name, job);
                console.log(`📝 Loaded job: ${config.job_name} (${config.service} → ${config.endpoint})`);
            }
        } catch (error) {
            console.error('Error loading job configurations:', error);
        }
    }

    /**
     * Get service URL from environment variables
     */
    private getServiceUrl(serviceName: string): string {
        const envVar = `${serviceName.toUpperCase().replace(/-/g, '_')}_URL`;
        const url = process.env[envVar];

        if (!url) {
            console.warn(`⚠️  No URL configured for service ${serviceName} (env: ${envVar})`);
            return `http://localhost:8080`; // Default fallback
        }

        return url;
    }

    /**
     * Register a new job
     */
    async registerJob(job: ScheduledJob): Promise<void> {
        console.log(`📋 Registering job: ${job.name} (${job.service})`);

        // Validate cron expression
        if (!cron.validate(job.cronExpression)) {
            throw new Error(`Invalid cron expression for job ${job.name}: ${job.cronExpression}`);
        }

        // Store in memory
        this.jobs.set(job.name, job);

        // Upsert to database
        const { error } = await supabase
            .from('job_schedules')
            .upsert({
                job_name: job.name,
                display_name: job.displayName,
                description: job.description,
                cron_expression: job.cronExpression,
                enabled: job.enabled,
                job_type: job.jobType,
                service: job.service,
                endpoint: job.endpoint,
                config: job.config || {},
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'job_name',
            });

        if (error) {
            console.error(`Failed to register job ${job.name}:`, error);
            throw error;
        }

        // Start if enabled
        if (job.enabled && this.isInitialized) {
            this.startJob(job.name);
        }

        console.log(`✓ Job registered: ${job.name}`);
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
     * Execute a job by calling its service endpoint
     */
    async executeJob(
        jobName: string,
        triggeredBy: 'scheduler' | 'manual' | 'admin' = 'scheduler',
        triggeredByUser?: string
    ): Promise<JobResult> {
        const job = this.jobs.get(jobName);
        if (!job) {
            throw new Error(`Job ${jobName} not found`);
        }

        console.log(`\n🔄 Starting job execution: ${job.displayName}`);
        console.log(`   Service: ${job.service}`);
        console.log(`   Endpoint: ${job.endpoint}`);
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
            // Call the service endpoint
            const url = `${job.serviceUrl}${job.endpoint}`;
            console.log(`   Calling: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Scheduler-Execution-Id': executionId,
                },
                body: JSON.stringify(context),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result: JobResult = await response.json();

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
        // If triggered by user, resolve Clerk user ID to internal UUID
        let userUuid: string | null = null;
        if (triggeredByUser) {
            try {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('clerk_user_id', triggeredByUser)
                    .single();

                if (userError) {
                    console.warn(`Could not resolve user ID ${triggeredByUser}:`, userError.message);
                } else if (userData) {
                    userUuid = userData.id;
                }
            } catch (error) {
                console.warn(`Error resolving user ID ${triggeredByUser}:`, error);
            }
        }

        const { data, error } = await supabase
            .from('scheduled_jobs')
            .insert({
                job_name: jobName,
                job_type: jobType,
                status: 'running',
                triggered_by: triggeredBy,
                triggered_by_user: userUuid,
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
     * Update job cron expression
     */
    async updateCronExpression(jobName: string, cronExpression: string): Promise<void> {
        const job = this.jobs.get(jobName);
        if (!job) {
            throw new Error(`Job ${jobName} not found`);
        }

        // Validate cron expression
        if (!cron.validate(cronExpression)) {
            throw new Error(`Invalid cron expression: ${cronExpression}`);
        }

        // Update in memory
        job.cronExpression = cronExpression;

        // Update database
        await supabase
            .from('job_schedules')
            .update({
                cron_expression: cronExpression,
                updated_at: new Date().toISOString()
            })
            .eq('job_name', jobName);

        // Restart if enabled
        if (job.enabled) {
            this.stopJob(jobName);
            this.startJob(jobName);
        }

        console.log(`✅ Updated cron expression for ${jobName}: ${cronExpression}`);
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
     * Delete a job
     */
    async deleteJob(jobName: string): Promise<void> {
        // Stop if running
        this.stopJob(jobName);

        // Remove from memory
        this.jobs.delete(jobName);

        // Delete from database
        await supabase
            .from('job_schedules')
            .delete()
            .eq('job_name', jobName);

        console.log(`🗑️  Deleted job: ${jobName}`);
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
export const scheduler = new Scheduler();
