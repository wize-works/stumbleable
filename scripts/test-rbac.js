/**
 * Test script for RBAC system
 * Tests role checking, promotion, and access control
 * 
 * Run with: node scripts/test-rbac.js
 */

import dotenv from 'dotenv';
dotenv.config();

const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:7003';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(color, prefix, message) {
    console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

async function testHealthCheck() {
    log('blue', '🔍', 'Testing user service health...');
    try {
        const response = await fetch(`${USER_API_URL}/health`);
        const data = await response.json();

        if (response.ok && data.status === 'healthy') {
            log('green', '✅', 'User service is healthy');
            return true;
        } else {
            log('red', '❌', 'User service is not healthy');
            return false;
        }
    } catch (error) {
        log('red', '❌', `Failed to connect to user service: ${error.message}`);
        return false;
    }
}

async function testRoleEndpoints() {
    log('blue', '\n🔍', 'Testing role endpoints (without auth)...');

    // Test /api/roles/me without auth (should fail)
    log('cyan', '📝', 'Testing GET /api/roles/me without authentication...');
    try {
        const response = await fetch(`${USER_API_URL}/api/roles/me`);

        if (response.status === 401) {
            log('green', '✅', 'Correctly rejected unauthenticated request (401)');
        } else {
            log('yellow', '⚠️', `Expected 401, got ${response.status}`);
        }
    } catch (error) {
        log('red', '❌', `Error: ${error.message}`);
    }

    // Test /api/roles/check without auth (should fail)
    log('cyan', '📝', 'Testing GET /api/roles/check without authentication...');
    try {
        const response = await fetch(`${USER_API_URL}/api/roles/check?required=moderator`);

        if (response.status === 401) {
            log('green', '✅', 'Correctly rejected unauthenticated request (401)');
        } else {
            log('yellow', '⚠️', `Expected 401, got ${response.status}`);
        }
    } catch (error) {
        log('red', '❌', `Error: ${error.message}`);
    }
}

async function testRoleCheck() {
    log('blue', '\n🔍', 'Testing role hierarchy...');

    const roleHierarchy = {
        user: 1,
        moderator: 2,
        admin: 3,
    };

    const tests = [
        { userRole: 'admin', required: 'user', expected: true },
        { userRole: 'admin', required: 'moderator', expected: true },
        { userRole: 'admin', required: 'admin', expected: true },
        { userRole: 'moderator', required: 'user', expected: true },
        { userRole: 'moderator', required: 'moderator', expected: true },
        { userRole: 'moderator', required: 'admin', expected: false },
        { userRole: 'user', required: 'user', expected: true },
        { userRole: 'user', required: 'moderator', expected: false },
        { userRole: 'user', required: 'admin', expected: false },
    ];

    log('cyan', '📝', 'Checking role hierarchy logic...');
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const hasAccess = roleHierarchy[test.userRole] >= roleHierarchy[test.required];

        if (hasAccess === test.expected) {
            passed++;
            log('green', '  ✅', `${test.userRole} → ${test.required}: ${hasAccess} (correct)`);
        } else {
            failed++;
            log('red', '  ❌', `${test.userRole} → ${test.required}: ${hasAccess} (expected ${test.expected})`);
        }
    }

    log('blue', '\n📊', `Results: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

async function runTests() {
    console.log('\n' + '='.repeat(60));
    log('cyan', '🧪', 'RBAC System Test Suite');
    console.log('='.repeat(60) + '\n');

    const healthOk = await testHealthCheck();

    if (!healthOk) {
        log('yellow', '\n⚠️', 'User service is not running. Start it with: npm run dev:user');
        process.exit(1);
    }

    await testRoleEndpoints();
    await testRoleCheck();

    console.log('\n' + '='.repeat(60));
    log('green', '✨', 'Test suite completed!');
    console.log('='.repeat(60) + '\n');

    log('blue', '📝', 'Next steps:');
    console.log('   1. Apply the migration: node scripts/apply-roles-migration.js');
    console.log('   2. Promote a user to moderator using SQL:');
    console.log('      UPDATE users SET role = \'moderator\' WHERE clerk_user_id = \'YOUR_ID\';');
    console.log('   3. Test the moderation panel: http://localhost:3000/admin/moderation');
    console.log('   4. Test with Clerk authentication in the browser\n');
}

runTests().catch(error => {
    log('red', '❌', `Test suite failed: ${error.message}`);
    process.exit(1);
});
