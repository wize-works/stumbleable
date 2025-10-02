#!/usr/bin/env node

/**
 * Setup script for Stumbleable development environment
 * Installs dependencies for all services and sets up environment files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const services = [
    { name: 'UI Portal', path: 'ui/portal' },
    { name: 'Discovery Service', path: 'apis/discovery-service' },
    { name: 'Interaction Service', path: 'apis/interaction-service' },
];

function runCommand(command, cwd = process.cwd()) {
    try {
        console.log(`Running: ${command} ${cwd !== process.cwd() ? `(in ${cwd})` : ''}`);
        execSync(command, {
            cwd,
            stdio: 'inherit',
            env: { ...process.env }
        });
        return true;
    } catch (error) {
        console.error(`❌ Command failed: ${command}`);
        console.error(error.message);
        return false;
    }
}

function copyEnvFile(servicePath, serviceName) {
    const envExamplePath = path.join(servicePath, '.env.example');
    const envPath = path.join(servicePath, '.env');

    if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
        try {
            fs.copyFileSync(envExamplePath, envPath);
            console.log(`✅ Created .env file for ${serviceName}`);
        } catch (error) {
            console.warn(`⚠️ Could not create .env file for ${serviceName}: ${error.message}`);
        }
    }
}

async function main() {
    console.log('🚀 Setting up Stumbleable development environment...\n');

    // Install root dependencies
    console.log('📦 Installing root dependencies...');
    if (!runCommand('npm install')) {
        process.exit(1);
    }

    // Install dependencies for each service
    for (const service of services) {
        console.log(`\n📦 Installing dependencies for ${service.name}...`);

        if (!fs.existsSync(service.path)) {
            console.warn(`⚠️ Service directory not found: ${service.path}`);
            continue;
        }

        if (!runCommand('npm install', service.path)) {
            console.error(`❌ Failed to install dependencies for ${service.name}`);
            process.exit(1);
        }

        // Copy environment files
        copyEnvFile(service.path, service.name);
    }

    console.log('\n✅ Setup complete!');
    console.log('\n🎯 Next steps:');
    console.log('  1. Review and update .env files if needed');
    console.log('  2. Run `npm run dev` to start all services');
    console.log('  3. Run `npm run health` to check service status');
    console.log('\n📖 See DEVELOPMENT_PORTS.md for more information');
}

main().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
});