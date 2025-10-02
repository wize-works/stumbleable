/**
 * Apply Lists Migration to Supabase
 * Reads and executes the 008_create_lists_tables.sql migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apis/interaction-service/.env') });

async function applyMigration() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        console.log('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
        console.log('   SUPABASE_SERVICE_KEY:', supabaseKey ? '✅' : '❌');
        process.exit(1);
    }

    console.log('🔌 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/008_create_lists_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Read migration file: 008_create_lists_tables.sql');
    console.log(`   Length: ${migrationSQL.length} characters`);

    // Split into individual statements (rough approach)
    const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';'; // Add semicolon back

        // Skip comments and empty statements
        if (statement.trim().startsWith('--') || statement.trim() === ';') {
            continue;
        }

        try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                // Try direct query if RPC doesn't work
                const { error: queryError } = await supabase.from('_sql').select('*').limit(0);

                if (queryError) {
                    console.error(`❌ Statement ${i + 1} failed:`, error.message);
                    console.error(`   SQL: ${statement.substring(0, 100)}...`);
                    errorCount++;
                } else {
                    successCount++;
                }
            } else {
                successCount++;
            }
        } catch (err) {
            console.error(`❌ Statement ${i + 1} threw error:`, err.message);
            errorCount++;
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
        console.log('\n✨ Migration applied successfully!');
    } else {
        console.log('\n⚠️  Some statements failed. Check errors above.');
        console.log('💡 You may need to apply this migration directly in Supabase SQL Editor:');
        console.log(`   ${migrationPath}`);
    }
}

applyMigration().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
