import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'apis', 'scheduler-service', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
    console.log('\n🔍 Checking scheduler jobs...\n');

    const { data: jobs, error } = await supabase
        .from('job_schedules')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs:', error);
        return;
    }

    console.log(`Found ${jobs.length} jobs:\n`);

    jobs.forEach(job => {
        console.log(`📋 Job: ${job.job_name}`);
        console.log(`   Display Name: ${job.display_name}`);
        console.log(`   Service: ${job.service}`);
        console.log(`   Endpoint: ${job.endpoint}`);
        console.log(`   Cron: ${job.cron_expression}`);
        console.log(`   Enabled: ${job.enabled}`);
        console.log(`   Type: ${job.job_type}`);
        console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);
        console.log('');
    });
}

checkJobs();
