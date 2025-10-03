/**
 * Email Service Test Script
 * Tests sending various email types through the email service
 */

const BASE_URL = 'http://localhost:7006/api';

// Test data
const testData = {
    welcome: {
        to: 'your-email@example.com', // CHANGE THIS to your actual email
        type: 'welcome',
        data: {
            userName: 'Test User',
            userId: 'test-user-123'
        }
    },
    weeklyTrending: {
        to: 'your-email@example.com', // CHANGE THIS to your actual email
        type: 'weekly-trending',
        data: {
            userName: 'Test User',
            discoveries: [
                {
                    id: '1',
                    title: 'Amazing Discovery #1',
                    url: 'https://example.com/1',
                    domain: 'example.com',
                    imageUrl: 'https://picsum.photos/seed/1/800/400',
                    description: 'This is an incredible discovery that you will love!',
                    topics: ['Technology', 'Science'],
                    readTime: 5,
                    upvotes: 156,
                    views: 2341
                },
                {
                    id: '2',
                    title: 'Fascinating Article #2',
                    url: 'https://example.com/2',
                    domain: 'example.com',
                    imageUrl: 'https://picsum.photos/seed/2/800/400',
                    description: 'Deep dive into fascinating topics.',
                    topics: ['Design', 'Art'],
                    readTime: 8,
                    upvotes: 234,
                    views: 3892
                },
                {
                    id: '3',
                    title: 'Trending Content #3',
                    url: 'https://example.com/3',
                    domain: 'example.com',
                    imageUrl: 'https://picsum.photos/seed/3/800/400',
                    description: 'What everyone is talking about this week.',
                    topics: ['Culture', 'Society'],
                    readTime: 6,
                    upvotes: 189,
                    views: 2756
                }
            ],
            weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            weekEnd: new Date().toISOString()
        }
    },
    weeklyNew: {
        to: 'your-email@example.com', // CHANGE THIS to your actual email
        type: 'weekly-new',
        data: {
            userName: 'Test User',
            discoveries: [
                {
                    id: '4',
                    title: 'Fresh Discovery #1',
                    url: 'https://example.com/4',
                    domain: 'example.com',
                    imageUrl: 'https://picsum.photos/seed/4/800/400',
                    description: 'Brand new content just added!',
                    topics: ['Technology'],
                    readTime: 4,
                    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: '5',
                    title: 'New Addition #2',
                    url: 'https://example.com/5',
                    domain: 'example.com',
                    imageUrl: 'https://picsum.photos/seed/5/800/400',
                    description: 'Latest addition to our collection.',
                    topics: ['Science'],
                    readTime: 7,
                    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
                }
            ],
            weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            weekEnd: new Date().toISOString()
        }
    },
    submissionReceived: {
        to: 'your-email@example.com', // CHANGE THIS to your actual email
        type: 'submission-received',
        data: {
            userName: 'Test User',
            submissionTitle: 'My Awesome Website',
            submissionUrl: 'https://mywebsite.com',
            submittedAt: new Date().toISOString()
        }
    },
    submissionApproved: {
        to: 'your-email@example.com', // CHANGE THIS to your actual email
        type: 'submission-approved',
        data: {
            userName: 'Test User',
            submissionTitle: 'My Awesome Website',
            submissionUrl: 'https://mywebsite.com',
            discoveryUrl: 'https://stumbleable.com/discover/123'
        }
    }
};

async function sendEmail(emailData) {
    try {
        console.log(`\n📧 Sending ${emailData.type} email to ${emailData.to}...`);

        const response = await fetch(`${BASE_URL}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ Success! Job ID: ${result.jobId}`);
            return result;
        } else {
            console.error(`❌ Failed:`, result);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error:`, error.message);
        return null;
    }
}

async function checkService() {
    try {
        console.log('🏥 Checking email service health...');
        const response = await fetch('http://localhost:7006/health');
        const data = await response.json();
        console.log('✅ Service is healthy:', data);
        return true;
    } catch (error) {
        console.error('❌ Service is not running. Please start it with: cd apis/email-service && npm run dev');
        return false;
    }
}

async function runTests() {
    console.log('🚀 Email Service Test Runner');
    console.log('================================\n');

    // Check if service is running
    const isHealthy = await checkService();
    if (!isHealthy) {
        process.exit(1);
    }

    console.log('\n⚠️  IMPORTANT: Update the email addresses in this script to your actual email!');
    console.log('Edit test-email-service.js and replace "your-email@example.com"\n');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test each email type
    console.log('\n📬 Starting email tests...\n');

    // Test 1: Welcome email
    await sendEmail(testData.welcome);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Weekly trending
    await sendEmail(testData.weeklyTrending);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Weekly new
    await sendEmail(testData.weeklyNew);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Submission received
    await sendEmail(testData.submissionReceived);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: Submission approved
    await sendEmail(testData.submissionApproved);

    console.log('\n✅ All test emails queued!');
    console.log('\n📝 Note: Emails are queued and will be processed by the background worker.');
    console.log('Check your email inbox in a few moments (including spam folder).');
    console.log('\n💡 To see the queue processing in real-time, check the email service logs.');
}

// Run the tests
runTests().catch(console.error);
