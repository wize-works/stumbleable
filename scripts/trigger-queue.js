/**
 * Trigger email queue processing manually
 */

const http = require('http');

console.log('🔄 Manually triggering email queue processing...\n');

const options = {
    hostname: '127.0.0.1',
    port: 7006,
    path: '/api/queue/process',
    method: 'POST',
    timeout: 10000
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
                console.log('✅ Queue processing triggered successfully!');
                console.log('Response:', result);
                console.log('\n📧 Check your email inbox now (including spam folder)');
                console.log('\n💡 To see what happened, check the email queue in the database:');
                console.log('   SELECT * FROM email_queue WHERE user_id = \'f6e7bbc5-ea0f-4a10-88d8-fa08db6374e5\' ORDER BY created_at DESC;');
            } else {
                console.error(`❌ Failed (${res.statusCode}):`, result);
            }
        } catch (error) {
            console.error('❌ Error parsing response:', error.message);
            console.error('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the email service is running and the route is registered.');
    console.log('   You may need to restart the email service to pick up the new queue route.');
});

req.on('timeout', () => {
    console.error('❌ Request timeout');
    req.destroy();
});

req.end();
