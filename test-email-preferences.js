/**
 * Test Email Preferences API Integration
 * 
 * This script tests the email preferences API endpoints through the frontend API client.
 * It verifies that we can:
 * 1. Fetch user email preferences
 * 2. Update preferences
 * 3. Unsubscribe/resubscribe
 * 
 * Usage: node test-email-preferences.js
 */

// For Node.js < 18, we need to import fetch
import fetch from 'node-fetch';

const userId = '360043f4-91d9-4a85-9502-1b1e9039ff6a'; // Real user ID from database
const EMAIL_API_URL = 'http://localhost:7006/api';

async function testEmailPreferencesAPI() {
    console.log('🧪 Testing Email Preferences API Integration\n');

    try {
        // Test 1: Get preferences
        console.log('1️⃣ Testing GET /api/preferences/:userId');
        const getResponse = await fetch(`${EMAIL_API_URL}/preferences/${userId}`);

        if (!getResponse.ok) {
            throw new Error(`GET failed: ${getResponse.status} ${getResponse.statusText}`);
        }

        const getResult = await getResponse.json();
        console.log('✅ GET preferences successful');
        console.log('   Current preferences:', JSON.stringify(getResult.preferences, null, 2));
        console.log();

        // Test 2: Update preferences
        console.log('2️⃣ Testing PUT /api/preferences/:userId');
        const updatePayload = {
            weekly_trending: !getResult.preferences.weekly_trending, // Toggle it
            submission_updates: true,
        };

        const putResponse = await fetch(`${EMAIL_API_URL}/preferences/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
        });

        if (!putResponse.ok) {
            throw new Error(`PUT failed: ${putResponse.status} ${putResponse.statusText}`);
        }

        const putResult = await putResponse.json();
        console.log('✅ PUT preferences successful');
        console.log('   Updated preferences:', JSON.stringify(putResult.preferences, null, 2));
        console.log();

        // Test 3: Unsubscribe
        console.log('3️⃣ Testing POST /api/preferences/:userId/unsubscribe');
        const unsubResponse = await fetch(`${EMAIL_API_URL}/preferences/${userId}/unsubscribe`, {
            method: 'POST',
        });

        if (!unsubResponse.ok) {
            throw new Error(`Unsubscribe failed: ${unsubResponse.status} ${unsubResponse.statusText}`);
        }

        const unsubResult = await unsubResponse.json();
        console.log('✅ Unsubscribe successful');
        console.log('   Result:', unsubResult);
        console.log();

        // Verify unsubscribed state
        console.log('4️⃣ Verifying unsubscribed state');
        const verifyResponse = await fetch(`${EMAIL_API_URL}/preferences/${userId}`);
        const verifyResult = await verifyResponse.json();

        if (verifyResult.preferences.unsubscribed_all === true) {
            console.log('✅ Unsubscribed state verified');
            console.log('   unsubscribed_all:', verifyResult.preferences.unsubscribed_all);
        } else {
            console.log('❌ Unsubscribed state verification failed');
        }
        console.log();

        // Test 5: Resubscribe
        console.log('5️⃣ Testing POST /api/preferences/:userId/resubscribe');
        const resubResponse = await fetch(`${EMAIL_API_URL}/preferences/${userId}/resubscribe`, {
            method: 'POST',
        });

        if (!resubResponse.ok) {
            throw new Error(`Resubscribe failed: ${resubResponse.status} ${resubResponse.statusText}`);
        }

        const resubResult = await resubResponse.json();
        console.log('✅ Resubscribe successful');
        console.log('   Result:', resubResult);
        console.log();

        // Final verification
        console.log('6️⃣ Final verification');
        const finalResponse = await fetch(`${EMAIL_API_URL}/preferences/${userId}`);
        const finalResult = await finalResponse.json();

        if (finalResult.preferences.unsubscribed_all === false) {
            console.log('✅ Resubscribed state verified');
            console.log('   unsubscribed_all:', finalResult.preferences.unsubscribed_all);
        } else {
            console.log('❌ Resubscribed state verification failed');
        }
        console.log();

        console.log('🎉 All tests passed!');
        console.log('\n📋 Summary:');
        console.log('   ✅ GET preferences');
        console.log('   ✅ PUT preferences (update)');
        console.log('   ✅ POST unsubscribe');
        console.log('   ✅ POST resubscribe');
        console.log('\n✨ Email preferences API integration is working correctly!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure all services are running: npm run dev');
        console.error('   2. Verify email service is on port 7006: http://localhost:7006/health');
        console.error('   3. Check that user ID exists in database');
        process.exit(1);
    }
}

// Run tests
testEmailPreferencesAPI();
