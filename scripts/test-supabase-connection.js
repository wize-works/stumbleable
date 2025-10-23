// Test Supabase connectivity from email service
import { supabase } from './apis/email-service/src/lib/supabase.js';

console.log('Testing Supabase connection...');
console.log('URL:', process.env.SUPABASE_URL);
console.log('Has Key:', !!process.env.SUPABASE_SERVICE_KEY);

try {
    const { data, error, count } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: false })
        .limit(1);

    if (error) {
        console.error('❌ Supabase error:', error);
        process.exit(1);
    }

    console.log('✅ Supabase connected successfully!');
    console.log('Total emails in queue:', count);
    console.log('Sample:', data);
    process.exit(0);
} catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
}
