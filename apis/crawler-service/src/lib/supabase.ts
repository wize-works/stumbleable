import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection on startup
(async () => {
    try {
        await supabase.from('crawler_sources').select('count').limit(1);
        console.log('✓ Supabase connection established');
    } catch (error) {
        console.error('✗ Supabase connection failed:', error);
    }
})();
