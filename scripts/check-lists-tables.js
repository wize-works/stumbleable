/**
 * Check if Lists tables exist in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apis/interaction-service/.env') });

async function checkTables() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    console.log('🔌 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const tablesToCheck = [
        'user_lists',
        'list_items',
        'list_followers',
        'list_collaborators',
        'quest_progress'
    ];

    console.log('\n📊 Checking tables...\n');

    for (const table of tablesToCheck) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .limit(0);

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                    console.log(`❌ ${table.padEnd(25)} - Does not exist`);
                } else {
                    console.log(`⚠️  ${table.padEnd(25)} - Error: ${error.message}`);
                }
            } else {
                console.log(`✅ ${table.padEnd(25)} - Exists (${count || 0} rows)`);
            }
        } catch (err) {
            console.log(`❌ ${table.padEnd(25)} - Error: ${err.message}`);
        }
    }

    console.log('\n💡 If tables are missing, apply the migration in Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('   2. Copy contents of: database/migrations/008_create_lists_tables.sql');
    console.log('   3. Paste and run in SQL Editor');
}

checkTables().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
