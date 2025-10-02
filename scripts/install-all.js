#!/usr/bin/env node

/**
 * Install dependencies for all services
 * Windows PowerShell compatible version
 */

const { execSync } = require('child_process');
const path = require('path');

function runCommand(command, cwd = process.cwd()) {
    try {
        console.log(`Running: ${command} ${cwd !== process.cwd() ? `(in ${cwd})` : ''}`);
        execSync(command, {
            cwd,
            stdio: 'inherit',
            shell: 'powershell.exe'
        });
        return true;
    } catch (error) {
        console.error(`❌ Command failed: ${command}`);
        console.error(error.message);
        return false;
    }
}

async function main() {
    console.log('📦 Installing dependencies for all services...\n');

    // Install root dependencies
    console.log('📦 Installing root dependencies...');
    if (!runCommand('npm install')) {
        process.exit(1);
    }

    // Install UI dependencies
    console.log('\n📦 Installing UI Portal dependencies...');
    if (!runCommand('npm install', 'ui/portal')) {
        process.exit(1);
    }

    // Install Discovery Service dependencies
    console.log('\n📦 Installing Discovery Service dependencies...');
    if (!runCommand('npm install', 'apis/discovery-service')) {
        process.exit(1);
    }

    // Install Interaction Service dependencies
    console.log('\n📦 Installing Interaction Service dependencies...');
    if (!runCommand('npm install', 'apis/interaction-service')) {
        process.exit(1);
    }

    console.log('\n✅ All dependencies installed successfully!');
}

main().catch((error) => {
    console.error('Installation failed:', error);
    process.exit(1);
});