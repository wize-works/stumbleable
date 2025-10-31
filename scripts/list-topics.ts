import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../apis/discovery-service/.env') });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

const { data, error } = await supabase
    .from('topics')
    .select('id, name')
    .order('name');

if (error) {
    console.error('Error:', error);
} else {
    console.log(`\nTotal topics in database: ${data.length}\n`);
    data.forEach((topic, i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${topic.name}`);
    });
}
