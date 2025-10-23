/**
 * Test script to verify domain diversity in discovery results
 * Run with: node test-domain-diversity.js
 */

const DISCOVERY_API_URL = 'http://localhost:7001';
const TEST_USER_ID = 'test-user-123'; // Replace with actual Clerk user ID if testing with auth

async function testDomainDiversity() {
    console.log('🧪 Testing Domain Diversity in Discovery Service...\n');

    try {
        // Make multiple requests to get discovery results
        const numTests = 10;
        const allDomains = [];

        for (let i = 0; i < numTests; i++) {
            const response = await fetch(`${DISCOVERY_API_URL}/api/next`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wildness: 35,
                    seenIds: []
                })
            });

            if (!response.ok) {
                console.error(`❌ Request ${i + 1} failed:`, response.status, await response.text());
                continue;
            }

            const data = await response.json();
            const domain = data.discovery.domain;
            allDomains.push(domain);

            console.log(`${i + 1}. ${domain} - ${data.discovery.title.substring(0, 60)}...`);
        }

        // Analyze domain diversity
        console.log('\n📊 Domain Diversity Analysis:');
        console.log('─'.repeat(60));

        const domainCounts = {};
        allDomains.forEach(domain => {
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        });

        const uniqueDomains = Object.keys(domainCounts).length;
        const totalRequests = allDomains.length;
        const diversityScore = (uniqueDomains / totalRequests) * 100;

        console.log(`Total discoveries: ${totalRequests}`);
        console.log(`Unique domains: ${uniqueDomains}`);
        console.log(`Diversity score: ${diversityScore.toFixed(1)}%`);
        console.log('\nDomain breakdown:');

        Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([domain, count]) => {
                const percentage = (count / totalRequests * 100).toFixed(1);
                const bar = '█'.repeat(Math.ceil(count / 2));
                console.log(`  ${domain.padEnd(30)} ${bar} ${count} (${percentage}%)`);
            });

        // Verdict
        console.log('\n' + '═'.repeat(60));
        if (diversityScore >= 70) {
            console.log('✅ EXCELLENT diversity - users will see varied content');
        } else if (diversityScore >= 50) {
            console.log('✓ GOOD diversity - acceptable variation');
        } else if (diversityScore >= 30) {
            console.log('⚠️  MODERATE diversity - some repetition expected');
        } else {
            console.log('❌ POOR diversity - one domain is dominating results');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\nMake sure:');
        console.error('1. Discovery service is running on port 7001');
        console.error('2. Database has content from multiple domains');
    }
}

// Run the test
testDomainDiversity();
