/**
 * A/B Testing Manager
 * H2.5: A/B testing framework for discovery algorithms
 * 
 * Manages experiment lifecycle, user assignments, and metrics tracking
 */

import { supabase } from './supabase';

export interface AlgorithmVariant {
    name: string;
    description: string;
    config: Record<string, any>; // Algorithm-specific configuration
}

export interface ExperimentDefinition {
    name: string;
    description: string;
    algorithmVariants: AlgorithmVariant[];
    trafficAllocation: Array<{ name: string; percentage: number }>;
    targetUserPercentage?: number;
    includeNewUsers?: boolean;
    includeExistingUsers?: boolean;
    startDate?: string;
    endDate?: string;
}

export interface ExperimentMetrics {
    variant_name: string;
    total_users: number;
    total_discoveries: number;
    like_count: number;
    save_count: number;
    share_count: number;
    skip_count: number;
    like_rate: number;
    save_rate: number;
    skip_rate: number;
    engagement_rate: number;
    avg_quality_score: number;
    avg_time_to_action: number;
    standard_error: number;
    confidence_interval_lower: number;
    confidence_interval_upper: number;
}

export interface StatisticalSignificance {
    variant_a_rate: number;
    variant_b_rate: number;
    difference: number;
    t_statistic: number;
    p_value: number;
    is_significant: boolean;
}

/**
 * Create a new A/B test experiment
 */
export async function createExperiment(
    definition: ExperimentDefinition,
    createdBy: string
): Promise<string | null> {
    try {
        // Validate traffic allocation sums to 100%
        const totalAllocation = definition.trafficAllocation.reduce(
            (sum, alloc) => sum + alloc.percentage,
            0
        );

        if (Math.abs(totalAllocation - 100) > 0.01) {
            console.error('Traffic allocation must sum to 100%');
            return null;
        }

        const { data, error } = await supabase
            .from('algorithm_experiments')
            .insert({
                name: definition.name,
                description: definition.description,
                algorithm_variants: definition.algorithmVariants,
                traffic_allocation: definition.trafficAllocation,
                target_user_percentage: definition.targetUserPercentage || 100,
                include_new_users: definition.includeNewUsers !== false,
                include_existing_users: definition.includeExistingUsers !== false,
                start_date: definition.startDate || null,
                end_date: definition.endDate || null,
                status: 'draft',
                created_by: createdBy
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating experiment:', error);
            return null;
        }

        console.log(`✅ Created experiment: ${definition.name} (${data.id})`);
        return data.id;

    } catch (error) {
        console.error('Error in createExperiment:', error);
        return null;
    }
}

/**
 * Start an experiment (set status to active)
 */
export async function startExperiment(experimentId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('algorithm_experiments')
            .update({
                status: 'active',
                start_date: new Date().toISOString()
            })
            .eq('id', experimentId)
            .eq('status', 'draft');

        if (error) {
            console.error('Error starting experiment:', error);
            return false;
        }

        console.log(`🚀 Started experiment: ${experimentId}`);
        return true;

    } catch (error) {
        console.error('Error in startExperiment:', error);
        return false;
    }
}

/**
 * Pause an active experiment
 */
export async function pauseExperiment(experimentId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('algorithm_experiments')
            .update({ status: 'paused' })
            .eq('id', experimentId)
            .eq('status', 'active');

        if (error) {
            console.error('Error pausing experiment:', error);
            return false;
        }

        console.log(`⏸️ Paused experiment: ${experimentId}`);
        return true;

    } catch (error) {
        console.error('Error in pauseExperiment:', error);
        return false;
    }
}

/**
 * Complete an experiment and optionally declare a winner
 */
export async function completeExperiment(
    experimentId: string,
    winnerVariant?: string,
    confidenceLevel?: number
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('algorithm_experiments')
            .update({
                status: 'completed',
                end_date: new Date().toISOString(),
                winner_variant: winnerVariant || null,
                confidence_level: confidenceLevel || null
            })
            .eq('id', experimentId)
            .in('status', ['active', 'paused']);

        if (error) {
            console.error('Error completing experiment:', error);
            return false;
        }

        console.log(`✅ Completed experiment: ${experimentId}${winnerVariant ? ` (winner: ${winnerVariant})` : ''}`);
        return true;

    } catch (error) {
        console.error('Error in completeExperiment:', error);
        return false;
    }
}

/**
 * Get user's assigned variant for an experiment
 * Automatically assigns if not already assigned
 */
export async function getUserVariant(
    userId: string,
    experimentId: string
): Promise<string | null> {
    try {
        // Check if experiment is active
        const { data: experiment, error: expError } = await supabase
            .from('algorithm_experiments')
            .select('status, name')
            .eq('id', experimentId)
            .single();

        if (expError || !experiment || experiment.status !== 'active') {
            return null;
        }

        // Check existing assignment
        const { data: assignment, error: assignError } = await supabase
            .from('user_experiment_assignments')
            .select('variant_name')
            .eq('user_id', userId)
            .eq('experiment_id', experimentId)
            .single();

        if (assignError && assignError.code !== 'PGRST116') { // Not "no rows" error
            console.error('Error checking assignment:', assignError);
        }

        if (assignment) {
            return assignment.variant_name;
        }

        // Assign user to variant using database function
        const { data: variantData, error: variantError } = await supabase
            .rpc('assign_user_to_experiment', {
                p_user_id: userId,
                p_experiment_id: experimentId
            });

        if (variantError) {
            console.error('Error assigning variant:', variantError);
            return null;
        }

        console.log(`✅ Assigned user ${userId} to variant ${variantData} for experiment ${experiment.name}`);
        return variantData;

    } catch (error) {
        console.error('Error in getUserVariant:', error);
        return null;
    }
}

/**
 * Log an experiment event
 */
export async function logExperimentEvent(
    experimentId: string,
    userId: string,
    variantName: string,
    action: 'discovery_shown' | 'liked' | 'saved' | 'shared' | 'skipped',
    details: {
        contentId?: string;
        discoveryScore?: number;
        timeToAction?: number; // seconds
        wildnessSetting?: number;
        sessionId?: string;
    }
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('experiment_events')
            .insert({
                experiment_id: experimentId,
                user_id: userId,
                variant_name: variantName,
                action,
                content_id: details.contentId || null,
                discovery_score: details.discoveryScore || null,
                time_to_action: details.timeToAction || null,
                wildness_setting: details.wildnessSetting || null,
                user_session_id: details.sessionId || null
            });

        if (error) {
            console.error('Error logging experiment event:', error);
            return false;
        }

        return true;

    } catch (error) {
        console.error('Error in logExperimentEvent:', error);
        return false;
    }
}

/**
 * Calculate metrics for all variants in an experiment
 */
export async function calculateExperimentMetrics(experimentId: string): Promise<boolean> {
    try {
        // Get all variant names
        const { data: experiment, error: expError } = await supabase
            .from('algorithm_experiments')
            .select('algorithm_variants')
            .eq('id', experimentId)
            .single();

        if (expError || !experiment) {
            console.error('Error fetching experiment:', expError);
            return false;
        }

        const variants = experiment.algorithm_variants as AlgorithmVariant[];

        // Calculate metrics for each variant using database function
        for (const variant of variants) {
            const { error } = await supabase
                .rpc('calculate_experiment_metrics', {
                    p_experiment_id: experimentId,
                    p_variant_name: variant.name
                });

            if (error) {
                console.error(`Error calculating metrics for variant ${variant.name}:`, error);
            }
        }

        console.log(`✅ Calculated metrics for experiment: ${experimentId}`);
        return true;

    } catch (error) {
        console.error('Error in calculateExperimentMetrics:', error);
        return false;
    }
}

/**
 * Get metrics for an experiment
 */
export async function getExperimentMetrics(experimentId: string): Promise<ExperimentMetrics[]> {
    try {
        const { data, error } = await supabase
            .from('experiment_metrics')
            .select('*')
            .eq('experiment_id', experimentId)
            .order('engagement_rate', { ascending: false });

        if (error) {
            console.error('Error fetching experiment metrics:', error);
            return [];
        }

        return data as ExperimentMetrics[];

    } catch (error) {
        console.error('Error in getExperimentMetrics:', error);
        return [];
    }
}

/**
 * Compare two variants statistically
 */
export async function compareVariants(
    experimentId: string,
    variantA: string,
    variantB: string
): Promise<StatisticalSignificance | null> {
    try {
        const { data, error } = await supabase
            .rpc('calculate_statistical_significance', {
                p_experiment_id: experimentId,
                p_variant_a: variantA,
                p_variant_b: variantB
            })
            .single();

        if (error) {
            console.error('Error comparing variants:', error);
            return null;
        }

        return data as StatisticalSignificance;

    } catch (error) {
        console.error('Error in compareVariants:', error);
        return null;
    }
}

/**
 * Get all active experiments
 */
export async function getActiveExperiments(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('algorithm_experiments')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching active experiments:', error);
            return [];
        }

        return data || [];

    } catch (error) {
        console.error('Error in getActiveExperiments:', error);
        return [];
    }
}

/**
 * Get experiment details
 */
export async function getExperiment(experimentId: string): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .from('algorithm_experiments')
            .select('*')
            .eq('id', experimentId)
            .single();

        if (error) {
            console.error('Error fetching experiment:', error);
            return null;
        }

        return data;

    } catch (error) {
        console.error('Error in getExperiment:', error);
        return null;
    }
}

/**
 * Get experiment results summary with winner determination
 */
export async function getExperimentResults(experimentId: string): Promise<{
    experiment: any;
    metrics: ExperimentMetrics[];
    comparisons: Array<{
        variants: [string, string];
        significance: StatisticalSignificance;
    }>;
    recommendation: {
        winnerVariant: string;
        confidence: number;
        reason: string;
    } | null;
} | null> {
    try {
        const [experiment, metrics] = await Promise.all([
            getExperiment(experimentId),
            getExperimentMetrics(experimentId)
        ]);

        if (!experiment || metrics.length < 2) {
            return null;
        }

        // Compare all variant pairs
        const comparisons: Array<{
            variants: [string, string];
            significance: StatisticalSignificance;
        }> = [];

        for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
                const significance = await compareVariants(
                    experimentId,
                    metrics[i].variant_name,
                    metrics[j].variant_name
                );

                if (significance) {
                    comparisons.push({
                        variants: [metrics[i].variant_name, metrics[j].variant_name],
                        significance
                    });
                }
            }
        }

        // Determine winner (highest engagement rate with statistical significance)
        const sortedMetrics = [...metrics].sort((a, b) => b.engagement_rate - a.engagement_rate);
        const topVariant = sortedMetrics[0];
        const secondVariant = sortedMetrics[1];

        let recommendation: {
            winnerVariant: string;
            confidence: number;
            reason: string;
        } | null = null;

        if (topVariant && secondVariant) {
            const comparisonResult = comparisons.find(c =>
                (c.variants[0] === topVariant.variant_name && c.variants[1] === secondVariant.variant_name) ||
                (c.variants[1] === topVariant.variant_name && c.variants[0] === secondVariant.variant_name)
            );

            if (comparisonResult) {
                const significance = comparisonResult.significance;
                const improvementPercent = Math.abs(significance.difference * 100);
                const confidence = (1 - significance.p_value) * 100;

                if (significance.is_significant) {
                    recommendation = {
                        winnerVariant: topVariant.variant_name,
                        confidence,
                        reason: `${topVariant.variant_name} shows ${improvementPercent.toFixed(1)}% improvement with statistical significance (p < 0.05)`
                    };
                } else if (topVariant.total_discoveries < 100) {
                    recommendation = {
                        winnerVariant: topVariant.variant_name,
                        confidence: 50,
                        reason: `Insufficient data (${topVariant.total_discoveries} samples). Continue testing to reach significance.`
                    };
                } else {
                    recommendation = {
                        winnerVariant: topVariant.variant_name,
                        confidence: confidence,
                        reason: `${topVariant.variant_name} leads by ${improvementPercent.toFixed(1)}% but not yet statistically significant. Continue testing.`
                    };
                }
            }
        }

        return {
            experiment,
            metrics,
            comparisons,
            recommendation
        };

    } catch (error) {
        console.error('Error in getExperimentResults:', error);
        return null;
    }
}

/**
 * Delete an experiment (draft only)
 */
export async function deleteExperiment(experimentId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('algorithm_experiments')
            .delete()
            .eq('id', experimentId)
            .eq('status', 'draft');

        if (error) {
            console.error('Error deleting experiment:', error);
            return false;
        }

        console.log(`🗑️ Deleted experiment: ${experimentId}`);
        return true;

    } catch (error) {
        console.error('Error in deleteExperiment:', error);
        return false;
    }
}
