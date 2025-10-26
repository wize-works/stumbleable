/**
 * Bulk Database Repair Script: Fix allows_framing Detection
 * 
 * This script groups content by domain, checks one URL per domain,
 * then bulk updates all content from that domain.
 * Much more efficient for large datasets (40k+ items).
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Extract domain from URL
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return null;
    }
}

/**
 * Check if URL allows framing based on headers
 */
async function checkAllowsFraming(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Stumbleable/1.0 (+https://stumbleable.com)'
            }
        });

        // Check X-Frame-Options
        const xFrameOptions = response.headers.get('x-frame-options');
        if (xFrameOptions) {
            const value = xFrameOptions.toLowerCase();
            if (value === 'deny' || value === 'sameorigin') {
                return { allowsFraming: false, reason: `X-Frame-Options: ${xFrameOptions}` };
            }
        }

        // Check CSP frame-ancestors
        const csp = response.headers.get('content-security-policy');
        if (csp) {
            const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/i);
            if (frameAncestorsMatch) {
                const value = frameAncestorsMatch[1].trim();

                // Special case: bare * means allow from anywhere
                if (value === '*') {
                    return { allowsFraming: true, reason: "CSP frame-ancestors: * (allows all)" };
                }

                // If it's 'none' or 'self', it blocks framing
                if (value === "'none'" || value === "'self'") {
                    return { allowsFraming: false, reason: `CSP frame-ancestors: ${value}` };
                }

                // If it contains domain restrictions (no https: or http: scheme), it blocks general framing
                if (!value.includes('https:') && !value.includes('http:')) {
                    return { allowsFraming: false, reason: `CSP frame-ancestors: ${value} (domain-restricted)` };
                }
            }
        }

        return { allowsFraming: true, reason: 'No blocking headers detected' };
    } catch (error) {
        console.error(`  ⚠️  Error checking URL: ${error.message}`);
        return null;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🔍 Fetching all content items grouped by domain...\n');

    // Get total count first
    const { count } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .not('url', 'is', null);

    console.log(`📊 Total content items: ${count?.toLocaleString() || 0}\n`);

    // Fetch all content in batches (Supabase has 1000 row limit per request)
    const batchSize = 1000;
    const allContent = [];
    let offset = 0;

    while (offset < (count || 0)) {
        console.log(`   Fetching batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil((count || 0) / batchSize)}...`);

        const { data, error } = await supabase
            .from('content')
            .select('id, url, domain')
            .not('url', 'is', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + batchSize - 1);

        if (error) {
            console.error('❌ Error fetching content:', error);
            process.exit(1);
        }

        if (!data || data.length === 0) break;

        allContent.push(...data);
        offset += batchSize;
    }

    console.log(`\n✅ Loaded ${allContent.length.toLocaleString()} content items\n`);

    // Group by domain
    const domainGroups = new Map();
    let nullDomainCount = 0;

    for (const item of allContent) {
        const domain = item.domain || extractDomain(item.url);
        if (!domain) {
            nullDomainCount++;
            continue;
        }

        if (!domainGroups.has(domain)) {
            domainGroups.set(domain, []);
        }
        domainGroups.get(domain).push(item);
    }

    console.log(`🌐 Found ${domainGroups.size.toLocaleString()} unique domains`);
    if (nullDomainCount > 0) {
        console.log(`⚠️  ${nullDomainCount} items skipped (no valid domain)\n`);
    }

    // Sort domains by count (descending)
    const sortedDomains = Array.from(domainGroups.entries())
        .sort((a, b) => b[1].length - a[1].length);

    console.log('📋 Top 20 domains by content count:');
    console.log('─'.repeat(80));
    sortedDomains.slice(0, 20).forEach(([domain, items], index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${domain.padEnd(40)} ${items.length.toLocaleString().padStart(6)} items`);
    });
    console.log('\n');

    // Check one URL per domain
    console.log('🔍 Checking framing permissions for each domain...\n');

    const domainResults = new Map();
    let checked = 0;
    let errors = 0;

    for (const [domain, items] of sortedDomains) {
        checked++;
        process.stdout.write(`[${checked}/${sortedDomains.length}] Checking ${domain}...`.padEnd(80) + '\r');

        // Pick the first item's URL
        const testUrl = items[0].url;
        const result = await checkAllowsFraming(testUrl);

        if (result === null) {
            errors++;
            domainResults.set(domain, {
                allowsFraming: null,
                reason: 'Error fetching headers',
                count: items.length,
                itemIds: items.map(i => i.id)
            });
        } else {
            domainResults.set(domain, {
                allowsFraming: result.allowsFraming,
                reason: result.reason,
                count: items.length,
                itemIds: items.map(i => i.id)
            });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n');
    console.log('═'.repeat(80));
    console.log('📋 SUMMARY');
    console.log('═'.repeat(80));

    let totalAllowFraming = 0;
    let totalBlockFraming = 0;
    let totalErrors = 0;
    let totalItemsAllowFraming = 0;
    let totalItemsBlockFraming = 0;
    let totalItemsError = 0;

    for (const [domain, result] of domainResults) {
        if (result.allowsFraming === null) {
            totalErrors++;
            totalItemsError += result.count;
        } else if (result.allowsFraming) {
            totalAllowFraming++;
            totalItemsAllowFraming += result.count;
        } else {
            totalBlockFraming++;
            totalItemsBlockFraming += result.count;
        }
    }

    console.log(`✅ Domains allowing framing:  ${totalAllowFraming.toLocaleString().padStart(6)} (${totalItemsAllowFraming.toLocaleString()} items)`);
    console.log(`❌ Domains blocking framing:  ${totalBlockFraming.toLocaleString().padStart(6)} (${totalItemsBlockFraming.toLocaleString()} items)`);
    console.log(`⚠️  Domains with errors:       ${totalErrors.toLocaleString().padStart(6)} (${totalItemsError.toLocaleString()} items)`);
    console.log(`📊 Total checked:              ${sortedDomains.length.toLocaleString().padStart(6)} (${allContent.length.toLocaleString()} items)\n`);

    // Show domains that block framing
    if (totalBlockFraming > 0) {
        console.log('═'.repeat(80));
        console.log('🚫 DOMAINS BLOCKING FRAMING');
        console.log('═'.repeat(80));

        const blockingDomains = Array.from(domainResults.entries())
            .filter(([_, result]) => result.allowsFraming === false)
            .sort((a, b) => b[1].count - a[1].count);

        blockingDomains.forEach(([domain, result]) => {
            console.log(`\n📄 ${domain} (${result.count.toLocaleString()} items)`);
            console.log(`   Reason: ${result.reason}`);
        });
        console.log('\n');
    }

    // Prompt for confirmation
    console.log('═'.repeat(80));
    console.log('❓ Apply bulk updates to database?');
    console.log('═'.repeat(80));
    console.log(`This will update ${(totalItemsAllowFraming + totalItemsBlockFraming).toLocaleString()} content items.`);
    console.log(`- ${totalItemsAllowFraming.toLocaleString()} items → allows_framing = true`);
    console.log(`- ${totalItemsBlockFraming.toLocaleString()} items → allows_framing = false`);
    console.log(`- ${totalItemsError.toLocaleString()} items → skipped (errors)\n`);

    // Auto-proceed in this version (can add readline for confirmation if needed)
    console.log('🔄 Applying updates...\n');

    let updated = 0;
    let updateErrors = 0;

    for (const [domain, result] of domainResults) {
        if (result.allowsFraming === null) continue;

        // Bulk update all items for this domain
        const { error: updateError } = await supabase
            .from('content')
            .update({ allows_framing: result.allowsFraming })
            .in('id', result.itemIds);

        if (updateError) {
            console.error(`❌ Error updating ${domain}:`, updateError.message);
            updateErrors++;
        } else {
            updated += result.count;
            console.log(`✅ Updated ${domain}: ${result.count.toLocaleString()} items → allows_framing = ${result.allowsFraming}`);
        }
    }

    console.log('\n');
    console.log('═'.repeat(80));
    console.log('✅ COMPLETE');
    console.log('═'.repeat(80));
    console.log(`Successfully updated: ${updated.toLocaleString()} items`);
    if (updateErrors > 0) {
        console.log(`Update errors: ${updateErrors} domains`);
    }
    console.log('\n');
}

main().catch(console.error);
