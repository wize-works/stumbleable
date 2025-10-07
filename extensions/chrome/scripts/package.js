// Script to package the extension into a ZIP file
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distPath = path.resolve('dist');
const packagePath = path.resolve('stumbleable-extension.zip');

console.log('📦 Packaging extension...\n');

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist folder not found. Run "npm run build" first.');
    process.exit(1);
}

// Remove existing package if it exists
if (fs.existsSync(packagePath)) {
    fs.unlinkSync(packagePath);
    console.log('🗑️  Removed existing package\n');
}

// Create ZIP file
try {
    if (process.platform === 'win32') {
        // Windows: Use PowerShell's Compress-Archive
        execSync(
            `powershell Compress-Archive -Path dist\\* -DestinationPath stumbleable-extension.zip`,
            { stdio: 'inherit' }
        );
    } else {
        // Unix: Use zip command
        execSync('cd dist && zip -r ../stumbleable-extension.zip . && cd ..', {
            stdio: 'inherit'
        });
    }

    console.log('\n✨ Extension packaged successfully!');
    console.log(`📦 Package: ${packagePath}\n`);
    console.log('To install in Chrome:');
    console.log('1. Go to chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked"');
    console.log('4. Select the "dist" folder');
} catch (error) {
    console.error('❌ Error packaging extension:', error.message);
    process.exit(1);
}
