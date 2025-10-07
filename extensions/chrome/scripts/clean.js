// Script to clean the dist folder
const fs = require('fs');
const path = require('path');

const distPath = path.resolve('dist');

console.log('🧹 Cleaning dist folder...\n');

if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('✅ Dist folder cleaned');
} else {
    console.log('ℹ️  Dist folder does not exist (nothing to clean)');
}

console.log('\n✨ Clean complete!');
