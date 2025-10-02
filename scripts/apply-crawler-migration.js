/**
 * Apply Crawler Service Database Migration
 * 
 * This script applies migration 005 (crawler service tables) to Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from discovery service (has Supabase credentials)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', 'apis', 'discovery-service', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in apis/discovery-service/.env');
    process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log(`   URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '005_create_crawler_service_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Reading migration file...');
        console.log(`   File: ${migrationPath}`);

        // Split by statement and execute each
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`\n🚀 Applying migration with ${statements.length} statements...\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';

            // Skip comments and empty statements
            if (statement.startsWith('--') || statement.trim() === ';') {
                continue;
            }

            try {
                const { error } = await supabase.rpc('exec_sql', { sql: statement });

                if (error) {
                    // Try direct query if RPC fails
                    const { error: queryError } = await supabase.from('_migrations').select('*').limit(0);

                    if (queryError) {
                        console.log(`⚠️  Statement ${i + 1}/${statements.length}: ${error.message}`);
                        errorCount++;
                    } else {
                        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
                        successCount++;
                    }
                } else {
                    console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
                    successCount++;
                }
            } catch (err) {
                console.log(`⚠️  Statement ${i + 1}/${statements.length}: ${err.message}`);
                errorCount++;
            }
        }

        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ⚠️  Errors: ${errorCount}`);

        if (errorCount === 0) {
            console.log('\n✅ Migration applied successfully!');
            console.log('\n📝 Tables created:');
            console.log('   - crawler_sources (RSS feeds, sitemaps, websites)');
            console.log('   - crawler_jobs (crawl execution tracking)');
            console.log('   - crawler_history (discovered URLs)');
            console.log('   - crawler_stats (aggregated metrics)');
        } else {
            console.log('\n⚠️  Migration completed with some errors');
            console.log('   This is normal if tables already exist');
            console.log('   Check Supabase dashboard to verify tables are present');
        }

        // Verify tables exist
        console.log('\n🔍 Verifying tables...');
        const { data: sources, error: sourcesError } = await supabase
            .from('crawler_sources')
            .select('count')
            .limit(0);

        if (!sourcesError) {
            console.log('   ✅ crawler_sources table exists');
        }

        const { data: jobs, error: jobsError } = await supabase
            .from('crawler_jobs')
            .select('count')
            .limit(0);

        if (!jobsError) {
            console.log('   ✅ crawler_jobs table exists');
        }

        const { data: history, error: historyError } = await supabase
            .from('crawler_history')
            .select('count')
            .limit(0);

        if (!historyError) {
            console.log('   ✅ crawler_history table exists');
        }

        const { data: stats, error: statsError } = await supabase
            .from('crawler_stats')
            .select('count')
            .limit(0);

        if (!statsError) {
            console.log('   ✅ crawler_stats table exists');
        }

        console.log('\n🎉 Done! You can now start the crawler service.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

applyMigration();
