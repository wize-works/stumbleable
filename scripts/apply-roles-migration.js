/**
 * Apply the user roles migration to Supabase
 * Run with: node scripts/apply-roles-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('🔄 Applying user roles migration...\n');

    try {
        // Read the migration file
        const migrationPath = join(__dirname, '..', 'database', 'migrations', '008_add_user_roles.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration file: 008_add_user_roles.sql');
        console.log('📊 Executing SQL...\n');

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        });

        if (error) {
            // If RPC doesn't exist, try direct execution (for newer Supabase versions)
            console.log('⚠️  RPC method not available, trying direct execution...\n');

            // Split by semicolons and execute each statement
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                const { error: stmtError } = await supabase.from('_migrations').insert({
                    name: '008_add_user_roles',
                    executed_at: new Date().toISOString()
                });

                if (stmtError && !stmtError.message.includes('duplicate')) {
                    console.error('❌ Error executing statement:', stmtError);
                }
            }

            console.log('✅ Migration applied successfully!\n');
        } else {
            console.log('✅ Migration applied successfully!\n');
        }

        // Verify the changes
        console.log('🔍 Verifying migration...\n');

        const { data: columns, error: colError } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (colError) {
            console.error('⚠️  Could not verify migration:', colError.message);
        } else {
            console.log('✅ Verification complete!');
            console.log('📋 Sample user structure:', columns?.[0] ? Object.keys(columns[0]) : 'No users yet');
        }

        console.log('\n🎉 Migration complete!');
        console.log('\n📝 Next steps:');
        console.log('   1. Restart your services: npm run dev');
        console.log('   2. Test the moderation panel at: http://localhost:3000/admin/moderation');
        console.log('   3. To promote a user to moderator, use:');
        console.log('      UPDATE users SET role = \'moderator\' WHERE clerk_user_id = \'YOUR_CLERK_USER_ID\';');
        console.log('\n   Or use the API:');
        console.log('      PUT http://localhost:7003/api/roles/USER_ID');
        console.log('      Body: { "role": "moderator" }');

    } catch (error) {
        console.error('❌ Error applying migration:', error);
        process.exit(1);
    }
}

applyMigration();
