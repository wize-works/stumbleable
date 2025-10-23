// Comprehensive test for Content Submission System
// Run this with: node test-submission-system.js

const API_BASE = 'http://localhost:7001/api';

async function testSubmissionSystem() {
    console.log('🧪 Testing Content Submission System...\n');

    try {
        // Test 1: Valid submission
        console.log('1. Testing valid content submission...');
        const validSubmission = {
            url: 'https://www.bbc.com/news/science-environment',
            title: 'BBC Science News',
            description: 'Latest science and environment news',
            topics: ['science']
        };

        const submitResponse = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validSubmission)
        });

        if (submitResponse.ok) {
            const result = await submitResponse.json();
            console.log(`✅ Valid submission successful: ${result.discovery.title}`);
            console.log(`   Topics: ${result.discovery.topics.join(', ')}`);
        } else {
            const error = await submitResponse.json();
            console.log(`⚠️  Valid submission failed: ${error.error}`);
        }

        // Test 2: Duplicate detection
        console.log('\n2. Testing duplicate detection...');
        const duplicateResponse = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validSubmission)
        });

        if (duplicateResponse.status === 409) {
            console.log('✅ Duplicate detection working correctly');
        } else {
            console.log('❌ Duplicate detection failed');
        }

        // Test 3: Auto metadata extraction
        console.log('\n3. Testing auto metadata extraction...');
        const autoExtractSubmission = {
            url: 'https://stackoverflow.com/questions/tagged/javascript'
        };

        const autoResponse = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(autoExtractSubmission)
        });

        if (autoResponse.ok) {
            const result = await autoResponse.json();
            console.log(`✅ Auto extraction: ${result.discovery.title}`);
            console.log(`   Domain: ${result.discovery.domain}`);
            console.log(`   Auto-classified topics: ${result.discovery.topics.join(', ')}`);
        } else {
            const error = await autoResponse.json();
            console.log(`⚠️  Auto extraction test: ${error.error}`);
        }

        // Test 4: Invalid URL
        console.log('\n4. Testing invalid URL handling...');
        const invalidSubmission = {
            url: 'not-a-valid-url'
        };

        const invalidResponse = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invalidSubmission)
        });

        if (invalidResponse.status === 400) {
            console.log('✅ Invalid URL properly rejected');
        } else {
            console.log('❌ Invalid URL validation failed');
        }

        // Test 5: Submission stats
        console.log('\n5. Testing submission statistics...');
        const statsResponse = await fetch(`${API_BASE}/submit/stats`);

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Submission stats:');
            console.log(`   Total submissions: ${stats.totalSubmissions}`);
            console.log(`   Recent submissions: ${stats.recentSubmissions}`);
            console.log(`   Top domains: ${stats.topDomains.slice(0, 3).map(d => d.domain).join(', ')}`);
            console.log(`   Top topics: ${stats.topTopics.slice(0, 3).map(t => t.topic).join(', ')}`);
        } else {
            console.log('❌ Stats endpoint failed');
        }

        console.log('\n🎉 Content Submission System testing complete!');
        console.log('\nFrontend testing:');
        console.log('1. Go to http://localhost:3000/submit');
        console.log('2. Test form validation with invalid URLs');
        console.log('3. Submit valid content and verify success message');
        console.log('4. Try submitting duplicate content');
        console.log('5. Test topic selection and auto-classification');

    } catch (error) {
        console.error('❌ Error testing submission system:', error.message);
    }
}

testSubmissionSystem();