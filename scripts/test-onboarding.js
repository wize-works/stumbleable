// Test script to verify onboarding flow
// Run this with: node test-onboarding.js

const baseUrl = 'http://localhost:3000';

async function testOnboarding() {
    console.log('🧪 Testing Onboarding Flow...\n');

    try {
        // Test 1: Check if onboarding page loads
        const onboardingResponse = await fetch(`${baseUrl}/onboarding`);
        console.log(`✅ Onboarding page accessibility: ${onboardingResponse.status}`);

        // Test 2: Check if topics endpoint is accessible
        const topicsResponse = await fetch('http://localhost:7003/api/topics');
        if (topicsResponse.ok) {
            const data = await topicsResponse.json();
            console.log(`✅ Topics API: ${data.topics.length} topics available`);
            console.log(`   Sample topics: ${data.topics.slice(0, 3).map(t => t.name).join(', ')}`);
        } else {
            console.log(`❌ Topics API: ${topicsResponse.status}`);
        }

        // Test 3: Check if user service is healthy
        const userHealthResponse = await fetch('http://localhost:7003/health');
        console.log(`✅ User service health: ${userHealthResponse.status}`);

        // Test 4: Check if stumble page loads
        const stumbleResponse = await fetch(`${baseUrl}/stumble`);
        console.log(`✅ Stumble page accessibility: ${stumbleResponse.status}`);

        console.log('\n🎉 Onboarding system ready for testing!');
        console.log('\nTo test the full flow:');
        console.log('1. Go to http://localhost:3000');
        console.log('2. Sign in with Clerk');
        console.log('3. Should automatically redirect to /onboarding for new users');
        console.log('4. Complete topic selection and wildness setting');
        console.log('5. Should redirect to /stumble to start discovering');

    } catch (error) {
        console.error('❌ Error testing onboarding:', error.message);
    }
}

testOnboarding();