/**
 * Email Service Test Script
 * Tests sending various email types through the email service
 */

const http = require('http');
const BASE_URL = 'http://localhost:7006';

// Test data
const TEST_USER_ID = 'f6e7bbc5-ea0f-4a10-88d8-fa08db6374e5'; // Brandon Korous user ID from database
const TEST_EMAIL = 'bkorous@gmail.com';

const testData = {
    welcome: {
        userId: TEST_USER_ID,
        emailType: 'welcome',
        recipientEmail: TEST_EMAIL,
        templateData: {
            firstName: 'Bryan',
            email: TEST_EMAIL,
            preferredTopics: ['Technology', 'Science', 'Design']
        }
    },
    weeklyTrending: {
        userId: TEST_USER_ID,
        emailType: 'weekly-trending',
        recipientEmail: TEST_EMAIL,
        templateData: {
            firstName: 'Bryan',
            email: TEST_EMAIL,
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
        userId: TEST_USER_ID,
        emailType: 'weekly-new',
        recipientEmail: TEST_EMAIL,
        templateData: {
            firstName: 'Bryan',
            email: TEST_EMAIL,
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
        userId: TEST_USER_ID,
        emailType: 'submission-received',
        recipientEmail: TEST_EMAIL,
        templateData: {
            firstName: 'Bryan',
            email: TEST_EMAIL,
            submissionTitle: 'My Awesome Website',
            submissionUrl: 'https://mywebsite.com',
            submittedAt: new Date().toISOString()
        }
    },
    submissionApproved: {
        userId: TEST_USER_ID,
        emailType: 'submission-approved',
        recipientEmail: TEST_EMAIL,
        templateData: {
            firstName: 'Bryan',
            email: TEST_EMAIL,
            submissionTitle: 'My Awesome Website',
            submissionUrl: 'https://mywebsite.com',
            discoveryUrl: 'https://stumbleable.com/discover/123'
        }
    }
};

function sendEmail(emailData) {
    return new Promise((resolve) => {
        console.log(`\n📧 Sending ${emailData.emailType} email to ${emailData.recipientEmail}...`);

        const postData = JSON.stringify(emailData);
        const options = {
            hostname: '127.0.0.1',
            port: 7006,
            path: '/api/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`✅ Success! Email ID: ${result.emailId || result.id}`);
                        resolve(result);
                    } else {
                        console.error(`❌ Failed (${res.statusCode}):`, result);
                        resolve(null);
                    }
                } catch (error) {
                    console.error(`❌ Error parsing response:`, error.message);
                    console.error('Response:', data);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Error:`, error.message);
            resolve(null);
        });

        req.on('timeout', () => {
            console.error(`❌ Request timeout`);
            req.destroy();
            resolve(null);
        });

        req.write(postData);
        req.end();
    });
}

function checkService() {
    return new Promise((resolve) => {
        console.log('🏥 Checking email service health...');

        const options = {
            hostname: '127.0.0.1',
            port: 7006,
            path: '/health',
            method: 'GET',
            timeout: 5000
        };

        const req = http.get(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log('✅ Service is healthy:', result);
                        resolve(true);
                    } else {
                        console.error('❌ Service health check failed:', res.statusCode);
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ Error parsing health check response');
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Service is not running. Please start it with: cd apis/email-service && npm run dev');
            console.error('Error:', error.message);
            resolve(false);
        });

        req.on('timeout', () => {
            console.error('❌ Service health check timeout');
            req.destroy();
            resolve(false);
        });

        req.setTimeout(5000);
    });
}

async function runTests() {
    console.log('🚀 Email Service Test Runner');
    console.log('================================\n');

    // Check if service is running
    const isHealthy = await checkService();
    if (!isHealthy) {
        process.exit(1);
    }

    console.log('\n📧 Testing email sending to: bkorous@gmail.com');

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
