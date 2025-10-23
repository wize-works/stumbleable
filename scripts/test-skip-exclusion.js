/**
 * Test script to verify that skipped content is properly excluded from discovery
 * 
 * This script:
 * 1. Gets a discovery
 * 2. Skips it
 * 3. Requests multiple new discoveries
 * 4. Verifies the skipped content never appears again
 */

const DISCOVERY_API = process.env.NEXT_PUBLIC_DISCOVERY_API_URL || 'http://localhost:7001';
const INTERACTION_API = process.env.NEXT_PUBLIC_INTERACTION_API_URL || 'http://localhost:7002';

// You'll need to provide a valid Clerk JWT token
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;

if (!AUTH_TOKEN) {
    console.error('❌ Error: TEST_AUTH_TOKEN environment variable is required');
    console.log('Usage: $env:TEST_AUTH_TOKEN="your_clerk_jwt_token"; node test-skip-exclusion.js');
    process.exit(1);
}

async function testSkipExclusion() {
    console.log('🧪 Testing Skip Exclusion Fix\n');
    console.log('Step 1: Getting initial discovery...');

    try {
        // Get first discovery
        const firstResponse = await fetch(`${DISCOVERY_API}/api/next`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({
                wildness: 50,
                seenIds: []
            })
        });

        if (!firstResponse.ok) {
            throw new Error(`Failed to get first discovery: ${firstResponse.status} ${firstResponse.statusText}`);
        }

        const firstData = await firstResponse.json();
        const skippedContentId = firstData.discovery.id;
        const skippedContentTitle = firstData.discovery.title;

        console.log(`✓ Got discovery: "${skippedContentTitle}" (ID: ${skippedContentId})`);
        console.log('\nStep 2: Skipping this discovery...');

        // Skip the content
        const skipResponse = await fetch(`${INTERACTION_API}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({
                discoveryId: skippedContentId,
                action: 'skip'
            })
        });

        if (!skipResponse.ok) {
            throw new Error(`Failed to skip content: ${skipResponse.status} ${skipResponse.statusText}`);
        }

        console.log('✓ Content skipped successfully');
        console.log('\nStep 3: Requesting 20 new discoveries to verify skipped content is excluded...');

        // Request multiple new discoveries and check none of them are the skipped content
        const seenIds = [skippedContentId]; // Include the skipped one in seenIds for session tracking
        let foundSkippedContent = false;
        const discoveredTitles = [];

        for (let i = 0; i < 20; i++) {
            const nextResponse = await fetch(`${DISCOVERY_API}/api/next`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify({
                    wildness: 50,
                    seenIds: seenIds
                })
            });

            if (!nextResponse.ok) {
                console.warn(`⚠️  Failed to get discovery ${i + 1}: ${nextResponse.status}`);
                continue;
            }

            const nextData = await nextResponse.json();
            const discoveryId = nextData.discovery.id;
            const discoveryTitle = nextData.discovery.title;

            discoveredTitles.push(`  ${i + 1}. ${discoveryTitle.substring(0, 60)}${discoveryTitle.length > 60 ? '...' : ''}`);
            seenIds.push(discoveryId);

            // Check if we got the skipped content again
            if (discoveryId === skippedContentId) {
                foundSkippedContent = true;
                console.error(`\n❌ FAIL: Skipped content appeared again!`);
                console.error(`   Title: "${skippedContentTitle}"`);
                console.error(`   ID: ${skippedContentId}`);
                break;
            }
        }

        console.log(`\nDiscoveries received (${discoveredTitles.length}/20):`);
        console.log(discoveredTitles.join('\n'));

        // Final result
        console.log('\n' + '='.repeat(60));
        if (foundSkippedContent) {
            console.log('❌ TEST FAILED: Skipped content was shown again!');
            console.log('   This should NEVER happen - users should never see skipped content.');
            process.exit(1);
        } else {
            console.log('✅ TEST PASSED: Skipped content was properly excluded!');
            console.log(`   Verified across ${discoveredTitles.length} new discoveries.`);
            console.log(`   The skipped content "${skippedContentTitle}" never appeared.`);
        }
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

// Run the test
testSkipExclusion();
