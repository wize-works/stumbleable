/**
 * Setup Supabase Storage Buckets for Image Storage
 * Creates buckets for content images and favicons with public read access
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../apis/discovery-service/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    console.error('Please ensure apis/discovery-service/.env has SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
    console.log('🚀 Setting up Supabase Storage buckets...\n');

    // Create content-images bucket
    console.log('📦 Creating content-images bucket...');
    const { data: imagesData, error: imagesError } = await supabase.storage.createBucket('content-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    });

    if (imagesError) {
        if (imagesError.message.includes('already exists')) {
            console.log('ℹ️  content-images bucket already exists');
        } else {
            console.error('❌ Error creating content-images bucket:', imagesError);
        }
    } else {
        console.log('✅ content-images bucket created successfully');
    }

    // Create favicons bucket
    console.log('\n📦 Creating favicons bucket...');
    const { data: faviconsData, error: faviconsError } = await supabase.storage.createBucket('favicons', {
        public: true,
        fileSizeLimit: 1048576, // 1MB
        allowedMimeTypes: ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml', 'image/jpeg']
    });

    if (faviconsError) {
        if (faviconsError.message.includes('already exists')) {
            console.log('ℹ️  favicons bucket already exists');
        } else {
            console.error('❌ Error creating favicons bucket:', faviconsError);
        }
    } else {
        console.log('✅ favicons bucket created successfully');
    }

    // List all buckets to verify
    console.log('\n📋 Listing all buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('❌ Error listing buckets:', listError);
    } else {
        console.log('\n✅ Available buckets:');
        buckets.forEach(bucket => {
            console.log(`   - ${bucket.name} (public: ${bucket.public})`);
        });
    }

    console.log('\n🎉 Storage setup complete!\n');
}

setupStorageBuckets().catch(console.error);
