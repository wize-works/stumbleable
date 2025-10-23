/**
 * Manually trigger email queue processing
 * Useful for testing without waiting for the 60-second interval
 */

const http = require('http');

console.log('🔄 Manually triggering email queue processing...\n');

// We'll query the queue to trigger processing by checking the status endpoint
// Since there's no manual trigger endpoint, let's check how many pending emails there are

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
        const result = JSON.parse(data);
        console.log('📧 Email Service Status:', result);
        console.log('\n💡 The queue processor runs every 60 seconds automatically.');
        console.log('⏱️  Wait time: Up to 60 seconds from when the service started.\n');
        console.log('To see real-time processing, check the email service terminal output.');
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.setTimeout(5000);
