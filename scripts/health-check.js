#!/usr/bin/env node

/**
 * Health check script for all Stumbleable services
 * Checks if all services are running and healthy
 */

const http = require('http');
const https = require('https');

const services = [
    { name: 'UI Portal', url: 'http://127.0.0.1:3000', type: 'ui' },
    { name: 'Discovery Service', url: 'http://127.0.0.1:7001/health', type: 'api' },
    { name: 'Interaction Service', url: 'http://127.0.0.1:7002/health', type: 'api' },
    { name: 'User Service', url: 'http://127.0.0.1:7003/health', type: 'api' },
    { name: 'Crawler Service', url: 'http://127.0.0.1:7004/health', type: 'api' },
    { name: 'Email Service', url: 'http://127.0.0.1:7006/health', type: 'api' },
];

function checkService(service) {
    return new Promise((resolve) => {
        const client = service.url.startsWith('https') ? https : http;
        const startTime = Date.now();

        const req = client.get(service.url, { timeout: 5000 }, (res) => {
            const responseTime = Date.now() - startTime;
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    ...service,
                    status: res.statusCode >= 200 && res.statusCode < 400 ? 'healthy' : 'unhealthy',
                    statusCode: res.statusCode,
                    responseTime,
                    response: data,
                });
            });
        });

        req.on('error', (error) => {
            console.log(`Debug: Error checking ${service.name}: ${error.message}`);
            resolve({
                ...service,
                status: 'offline',
                statusCode: null,
                responseTime: null,
                error: error.message,
            });
        });

        req.on('timeout', () => {
            console.log(`Debug: Timeout checking ${service.name}`);
            req.destroy();
            resolve({
                ...service,
                status: 'timeout',
                statusCode: null,
                responseTime: null,
            });
        });

        req.setTimeout(5000);
    });
}

async function main() {
    console.log('🏥 Checking Stumbleable service health...\n');

    const results = await Promise.all(services.map(checkService));

    console.log('Service Status:');
    console.log('================');

    let allHealthy = true;

    results.forEach((result) => {
        const statusIcon = result.status === 'healthy' ? '✅' :
            result.status === 'offline' ? '❌' :
                result.status === 'timeout' ? '⏰' : '⚠️';

        const responseTime = result.responseTime ? `(${result.responseTime}ms)` : '';

        console.log(`${statusIcon} ${result.name.padEnd(20)} ${result.status.toUpperCase()} ${responseTime}`);

        if (result.status !== 'healthy') {
            allHealthy = false;
        }
    });

    console.log('\n================');

    if (allHealthy) {
        console.log('🎉 All services are healthy!');
        process.exit(0);
    } else {
        console.log('⚠️ Some services are not responding. Run `npm run dev` to start all services.');
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Error checking service health:', error);
    process.exit(1);
});