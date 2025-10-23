/**
 * Test Submission Email Integration
 * 
 * This script tests the email triggers for the submission lifecycle:
 * 1. submission-received: When content is submitted for review
 * 2. submission-approved: When moderator approves submission
 * 3. submission-rejected: When moderator rejects submission
 * 
 * Prerequisites:
 * - Email service running on port 7006
 * - Crawler service running on port 7004
 * - Moderation service running on port 7005
 * - Valid Clerk authentication token
 * - Test user with email in database
 */

const CRAWLER_API = 'http://localhost:7004';
const MODERATION_API = 'http://localhost:7005';
const EMAIL_API = 'http://localhost:7006';

// Test configuration
const TEST_SUBMISSION = {
    url: 'https://example.com/test-submission-email',
    title: 'Test Submission for Email Integration',
    description: 'Testing the submission email flow',
    topics: ['technology', 'testing'],
};

async function checkServiceHealth() {
    console.log('\n🏥 Checking service health...\n');

    const services = [
        { name: 'Email Service', url: `${EMAIL_API}/health` },
        { name: 'Crawler Service', url: `${CRAWLER_API}/health` },
        { name: 'Moderation Service', url: `${MODERATION_API}/health` },
    ];

    for (const service of services) {
        try {
            const response = await fetch(service.url);
            const status = response.ok ? '✅' : '❌';
            console.log(`${status} ${service.name}: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${service.name}: ${error.message}`);
        }
    }
}

async function submitContent(authToken) {
    console.log('\n📝 Submitting test content...\n');

    try {
        const response = await fetch(`${CRAWLER_API}/api/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(TEST_SUBMISSION),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Submission failed:', error);
            return null;
        }

        const result = await response.json();
        console.log('✅ Content submitted:', result);

        if (result.status === 'pending_review') {
            console.log('\n📧 Expected email: submission-received');
            console.log(`   Queue ID: ${result.queueId}`);
            return result.queueId;
        } else if (result.status === 'approved') {
            console.log('\n✅ Content auto-approved (no moderation email expected)');
            return null;
        }

        return result.queueId;
    } catch (error) {
        console.error('❌ Error submitting content:', error.message);
        return null;
    }
}

async function approveContent(queueId, authToken) {
    console.log('\n✅ Approving content...\n');

    try {
        const response = await fetch(`${MODERATION_API}/api/moderation/queue/${queueId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                action: 'approve',
                moderator_notes: 'Approved via test script',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Approval failed:', error);
            return false;
        }

        const result = await response.json();
        console.log('✅ Content approved:', result);
        console.log('\n📧 Expected email: submission-approved');
        console.log(`   Discovery ID: ${result.discoveryId}`);
        return true;
    } catch (error) {
        console.error('❌ Error approving content:', error.message);
        return false;
    }
}

async function rejectContent(queueId, authToken) {
    console.log('\n❌ Rejecting content...\n');

    try {
        const response = await fetch(`${MODERATION_API}/api/moderation/queue/${queueId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                action: 'reject',
                moderator_notes: 'Rejected via test script for testing email flow',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Rejection failed:', error);
            return false;
        }

        const result = await response.json();
        console.log('✅ Content rejected:', result);
        console.log('\n📧 Expected email: submission-rejected');
        console.log(`   Reason: ${result.moderator_notes}`);
        return true;
    } catch (error) {
        console.error('❌ Error rejecting content:', error.message);
        return false;
    }
}

async function checkEmailQueue() {
    console.log('\n📬 Checking email queue...\n');

    try {
        const response = await fetch(`${EMAIL_API}/api/queue`);

        if (!response.ok) {
            console.log('❌ Could not fetch queue (endpoint may not exist)');
            return;
        }

        const queue = await response.json();
        console.log(`Total emails in queue: ${queue.length}`);

        if (queue.length > 0) {
            console.log('\nRecent emails:');
            queue.slice(0, 5).forEach((email, index) => {
                console.log(`\n${index + 1}. ${email.email_type}`);
                console.log(`   To: ${email.recipient_email}`);
                console.log(`   Status: ${email.status}`);
                console.log(`   Queued: ${new Date(email.created_at).toLocaleString()}`);
            });
        }
    } catch (error) {
        console.log('ℹ️  Could not check queue:', error.message);
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('  SUBMISSION EMAIL INTEGRATION TEST');
    console.log('='.repeat(60));

    // Check if auth token is provided
    const authToken = process.env.TEST_AUTH_TOKEN;
    if (!authToken) {
        console.error('\n❌ Error: TEST_AUTH_TOKEN environment variable not set');
        console.log('\nUsage:');
        console.log('  $env:TEST_AUTH_TOKEN="your_clerk_token_here"');
        console.log('  node test-submission-emails.js');
        process.exit(1);
    }

    // Check service health
    await checkServiceHealth();

    // Test 1: Submit content and receive submission-received email
    console.log('\n' + '='.repeat(60));
    console.log('  TEST 1: Submission Received Email');
    console.log('='.repeat(60));

    const queueId = await submitContent(authToken);

    if (!queueId) {
        console.log('\n⚠️  Content was auto-approved or submission failed');
        console.log('   Cannot test moderation emails without manual review');
    } else {
        // Wait a moment for email to be queued
        console.log('\n⏱️  Waiting 2 seconds for email to be processed...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Approve content and receive submission-approved email
        console.log('\n' + '='.repeat(60));
        console.log('  TEST 2: Submission Approved Email');
        console.log('='.repeat(60));

        await approveContent(queueId, authToken);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: Submit another and reject (for rejection email)
        console.log('\n' + '='.repeat(60));
        console.log('  TEST 3: Submission Rejected Email');
        console.log('='.repeat(60));

        const TEST_SUBMISSION_2 = {
            ...TEST_SUBMISSION,
            url: 'https://example.com/test-rejection-email',
            title: 'Test Submission for Rejection Email',
        };

        const response = await fetch(`${CRAWLER_API}/api/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(TEST_SUBMISSION_2),
        });

        if (response.ok) {
            const result = await response.json();
            if (result.queueId) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await rejectContent(result.queueId, authToken);
            }
        }
    }

    // Check the email queue
    await new Promise(resolve => setTimeout(resolve, 2000));
    await checkEmailQueue();

    console.log('\n' + '='.repeat(60));
    console.log('  TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\n✅ All tests executed');
    console.log('📧 Check your email for the following messages:');
    console.log('   1. Submission received confirmation');
    console.log('   2. Submission approved notification');
    console.log('   3. Submission rejected notification');
    console.log('\n💡 Tip: Check the email service logs for queuing details');
}

main().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
