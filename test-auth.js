// Test script to verify API authentication
const https = require('http');

async function testAPI(url, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: '127.0.0.1', // Force IPv4
            port: urlObj.port,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing API Authentication...\n');

    // Test 1: Unauthorized request to Discovery Service
    console.log('1. Testing unauthorized request to Discovery Service...');
    try {
        const result = await testAPI('http://localhost:7001/api/next', 'POST', {
            wildness: 50,
            seenIds: []
        });
        console.log(`   Status: ${result.status}`);
        console.log(`   Expected: 401 (Unauthorized)`);
        console.log(`   Result: ${result.status === 401 ? '✅ PASS' : '❌ FAIL'}\n`);
    } catch (error) {
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 2: Unauthorized request to Interaction Service
    console.log('2. Testing unauthorized request to Interaction Service...');
    try {
        const result = await testAPI('http://localhost:7002/api/feedback', 'POST', {
            discoveryId: 'test-id',
            action: 'up'
        });
        console.log(`   Status: ${result.status}`);
        console.log(`   Expected: 401 (Unauthorized)`);
        console.log(`   Result: ${result.status === 401 ? '✅ PASS' : '❌ FAIL'}\n`);
    } catch (error) {
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 3: Unauthorized request to User Service
    console.log('3. Testing unauthorized request to User Service...');
    try {
        const result = await testAPI('http://localhost:7003/api/users/test-user-id', 'GET');
        console.log(`   Status: ${result.status}`);
        console.log(`   Expected: 401 (Unauthorized)`);
        console.log(`   Result: ${result.status === 401 ? '✅ PASS' : '❌ FAIL'}\n`);
    } catch (error) {
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 4: Health endpoints (should be public)
    console.log('4. Testing public health endpoints...');
    try {
        const results = await Promise.all([
            testAPI('http://localhost:7001/health'),
            testAPI('http://localhost:7002/health'),
            testAPI('http://localhost:7003/health')
        ]);

        results.forEach((result, index) => {
            const service = ['Discovery', 'Interaction', 'User'][index];
            console.log(`   ${service} Service Health: ${result.status === 200 ? '✅ PASS' : '❌ FAIL'} (${result.status})`);
        });
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n🎉 Authentication tests completed!');
}

runTests().catch(console.error);