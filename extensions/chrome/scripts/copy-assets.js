// Script to copy static assets to dist folder
const fs = require('fs');
const path = require('path');

const assets = [
    { src: 'manifest.json', dest: 'dist/manifest.json' },
    { src: 'src/popup.html', dest: 'dist/popup.html' },
    { src: 'src/popup.css', dest: 'dist/popup.css' },
    { src: 'icons', dest: 'dist/icons', isDir: true }
];

console.log('📦 Copying assets to dist folder...\n');

// Create dist folder if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
}

// Copy each asset
assets.forEach(asset => {
    const srcPath = path.resolve(asset.src);
    const destPath = path.resolve(asset.dest);

    if (asset.isDir) {
        // Copy directory
        if (fs.existsSync(srcPath)) {
            copyDir(srcPath, destPath);
            console.log(`✅ Copied directory: ${asset.src} → ${asset.dest}`);
        } else {
            console.log(`⚠️  Directory not found: ${asset.src} (skipping)`);
        }
    } else {
        // Copy file
        if (fs.existsSync(srcPath)) {
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied file: ${asset.src} → ${asset.dest}`);
        } else {
            console.log(`⚠️  File not found: ${asset.src} (skipping)`);
        }
    }
});

console.log('\n✨ Assets copied successfully!');

// Helper function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    entries.forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}
