#!/usr/bin/env node

/**
 * Cross-platform build script for @kanakkholwal/mailer
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_DIR = path.join(ROOT_DIR, 'package');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function step(msg) {
    log(`\n📦 ${msg}`, 'blue');
}

function success(msg) {
    log(`✅ ${msg}`, 'green');
}

function error(msg) {
    log(`❌ ${msg}`, 'red');
    process.exit(1);
}

// Main build function
async function build() {
    try {
        log('\n🚀 Building @kanakkholwal/mailer package...\n', 'yellow');

        // Step 1: Run tsup
        step('Running TypeScript build...');
        try {
            execSync('npx tsup', { stdio: 'inherit', cwd: ROOT_DIR });
            success('TypeScript build completed');
        } catch (err) {
            error('TypeScript build failed');
        }

        // Step 2: Ensure package directory exists
        if (!fs.existsSync(PACKAGE_DIR)) {
            fs.mkdirSync(PACKAGE_DIR, { recursive: true });
        }

        // Step 3: Copy package.json using read/write for better cross-platform support
        step('Copying package.json...');
        const emailsPackageJson = path.join(ROOT_DIR, 'emails.package.json');
        const destPackageJson = path.join(PACKAGE_DIR, 'package.json');

        // Debug: Check if source file exists and has content
        if (!fs.existsSync(emailsPackageJson)) {
            error('emails.package.json not found at: ' + emailsPackageJson);
        }

        const sourceStats = fs.statSync(emailsPackageJson);
        log(`   Source file size: ${sourceStats.size} bytes`, 'reset');

        if (sourceStats.size === 0) {
            error('emails.package.json is empty! Please check the file.');
        }

        // Read and write to ensure proper copying
        const pkgContent = fs.readFileSync(emailsPackageJson, 'utf8');

        log(`   Read ${pkgContent.length} characters from source`, 'reset');

        if (pkgContent.length === 0) {
            error('Failed to read content from emails.package.json');
        }

        // Validate JSON before writing
        try {
            JSON.parse(pkgContent);
        } catch (e) {
            error('emails.package.json is not valid JSON: ' + e.message);
        }

        fs.writeFileSync(destPackageJson, pkgContent, 'utf8');

        // Verify the copy
        if (!fs.existsSync(destPackageJson)) {
            error('Failed to create package.json');
        }

        const copiedContent = fs.readFileSync(destPackageJson, 'utf8');
        log(`   Wrote ${copiedContent.length} characters to destination`, 'reset');

        if (copiedContent.length === 0) {
            error('package.json was created but is empty');
        }

        if (copiedContent !== pkgContent) {
            error('Content mismatch between source and destination');
        }

        success(`package.json copied and verified (${copiedContent.length} bytes)`);

        // Step 4: Copy README.md
        step('Copying README.md...');
        const readmeSrc = path.join(ROOT_DIR, 'README.md');
        const readmeDest = path.join(PACKAGE_DIR, 'README.md');

        if (fs.existsSync(readmeSrc)) {
            const readmeContent = fs.readFileSync(readmeSrc, 'utf8');
            fs.writeFileSync(readmeDest, readmeContent, 'utf8');
            success(`README.md copied (${readmeContent.length} bytes)`);
        } else {
            log('⚠️  README.md not found, skipping...', 'yellow');
        }

        // Step 5: Copy LICENSE (if exists)
        const licenseSrc = path.join(ROOT_DIR, 'LICENSE');
        const licenseDest = path.join(PACKAGE_DIR, 'LICENSE');

        if (fs.existsSync(licenseSrc)) {
            step('Copying LICENSE...');
            const licenseContent = fs.readFileSync(licenseSrc, 'utf8');
            fs.writeFileSync(licenseDest, licenseContent, 'utf8');
            success(`LICENSE copied (${licenseContent.length} bytes)`);
        }

        // Step 6: Verify build output
        step('Verifying build output...');
        const distDir = path.join(PACKAGE_DIR, 'dist');

        if (!fs.existsSync(distDir)) {
            error('dist directory not found! Build may have failed.');
        }

        const files = fs.readdirSync(distDir);
        if (files.length === 0) {
            error('dist directory is empty! Build may have failed.');
        }

        // List generated files
        log('\n📄 Generated files:', 'blue');
        files.forEach(file => {
            const filePath = path.join(distDir, file);
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(2);
            log(`   • ${file} (${size} KB)`, 'reset');
        });

        success(`\nBuild output verified (${files.length} files generated)`);

        // Step 7: Display package structure
        log('\n📦 Package structure:', 'blue');
        log(`   package/`, 'reset');
        log(`   ├── dist/`, 'reset');
        files.slice(0, 5).forEach((file, idx) => {
            const isLast = idx === Math.min(files.length, 5) - 1 && files.length <= 5;
            log(`   │   ${isLast ? '└──' : '├──'} ${file}`, 'reset');
        });
        if (files.length > 5) {
            log(`   │   └── ... (${files.length - 5} more files)`, 'reset');
        }
        log(`   ├── package.json`, 'reset');
        if (fs.existsSync(readmeDest)) log(`   ├── README.md`, 'reset');
        if (fs.existsSync(licenseDest)) log(`   └── LICENSE`, 'reset');

        // Success!
        log('\n🎉 Package built successfully!\n', 'green');
        log(`📁 Output directory: ${PACKAGE_DIR}`, 'blue');
        log(`📊 Total size: ${(getTotalSize(PACKAGE_DIR) / 1024).toFixed(2)} KB`, 'blue');
        log('\n📝 Next steps:', 'yellow');
        log('   1. cd package', 'reset');
        log('   2. npm publish --access public', 'reset');
        log('\n   Or run: npm run publish:npm\n', 'yellow');

    } catch (err) {
        error(`Build failed: ${err.message}`);
    }
}

// Helper function to calculate total directory size
function getTotalSize(dirPath) {
    let size = 0;

    function getSize(itemPath) {
        const stats = fs.statSync(itemPath);

        if (stats.isFile()) {
            size += stats.size;
        } else if (stats.isDirectory()) {
            const items = fs.readdirSync(itemPath);
            items.forEach(item => {
                getSize(path.join(itemPath, item));
            });
        }
    }

    getSize(dirPath);
    return size;
}

// Run the build
build();