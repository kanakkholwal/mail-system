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
        const isOptimized = process.argv.includes('--optimized');
        
        if (isOptimized) {
            log('\n🚀 Building @kanakkholwal/mailer package (OPTIMIZED)...\n', 'yellow');
            process.env.BUILD_MODE = 'production';
        } else {
            log('\n🚀 Building @kanakkholwal/mailer package...\n', 'yellow');
        }

        // Step 1: Run tsup
        step('Running TypeScript build...');
        try {
            const buildCmd = isOptimized 
                ? 'npx tsup --minify' 
                : 'npx tsup';
            
            execSync(buildCmd, { stdio: 'inherit', cwd: ROOT_DIR });
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

        // Default package.json content if file is missing or empty
        const defaultPackageJson = {
            "name": "@kanakkholwal/mailer",
            "version": "1.0.0",
            "description": "Type-safe email templates with React Email and Zod validation",
            "main": "./dist/index.js",
            "module": "./dist/index.mjs",
            "types": "./dist/index.d.ts",
            "exports": {
                ".": {
                    "types": "./dist/index.d.ts",
                    "import": "./dist/index.mjs",
                    "require": "./dist/index.js"
                },
                "./templates/*": {
                    "types": "./dist/templates/*/index.d.ts",
                    "import": "./dist/templates/*/index.mjs",
                    "require": "./dist/templates/*/index.js"
                },
                "./kit/*": {
                    "types": "./dist/kit/*/index.d.ts",
                    "import": "./dist/kit/*/index.mjs",
                    "require": "./dist/kit/*/index.js"
                },
                "./renderer": {
                    "types": "./dist/renderer.d.ts",
                    "import": "./dist/renderer.mjs",
                    "require": "./dist/renderer.js"
                },
                "./registry": {
                    "types": "./dist/registry.d.ts",
                    "import": "./dist/registry.mjs",
                    "require": "./dist/registry.js"
                }
            },
            "files": [
                "dist",
                "README.md",
                "LICENSE"
            ],
            "keywords": [
                "email",
                "react-email",
                "nodemailer",
                "templates",
                "transactional-email",
                "typescript",
                "type-safe",
                "zod",
                "email-templates",
                "mailer"
            ],
            "author": "Kanak Kholwal",
            "license": "MIT",
            "repository": {
                "type": "git",
                "url": "https://github.com/kanakkholwal/mail-system.git",
                "directory": "emails"
            },
            "bugs": {
                "url": "https://github.com/kanakkholwal/mail-system/issues"
            },
            "homepage": "https://github.com/kanakkholwal/mail-system#readme",
            "peerDependencies": {
                "@react-email/components": ">=0.0.31",
                "react": ">=18.0.0",
                "zod": ">=3.0.0"
            },
            "dependencies": {
                "@react-email/components": "0.0.31",
                "@react-email/tailwind": "1.0.4",
                "nodemailer": "^6.9.16",
                "zod": "^3.24.1"
            },
            "devDependencies": {
                "@types/node": "^22",
                "@types/nodemailer": "^6.4.17",
                "@types/react": "^19",
                "react": "^19.2.3",
                "tsup": "^8.0.0",
                "typescript": "^5"
            },
            "publishConfig": {
                "access": "public",
                "registry": "https://registry.npmjs.org/"
            },
            "engines": {
                "node": ">=18.0.0"
            }
        };

        let pkgContent;

        // Check if source file exists and has content
        if (!fs.existsSync(emailsPackageJson)) {
            log('   ⚠️  emails.package.json not found, creating from template...', 'yellow');
            pkgContent = JSON.stringify(defaultPackageJson, null, 2);
            // Save the template for future use
            fs.writeFileSync(emailsPackageJson, pkgContent, 'utf8');
            log('   ✅ Created emails.package.json', 'green');
        } else {
            const sourceStats = fs.statSync(emailsPackageJson);
            
            if (sourceStats.size === 0) {
                log('   ⚠️  emails.package.json is empty, using default template...', 'yellow');
                pkgContent = JSON.stringify(defaultPackageJson, null, 2);
                // Update the empty file
                fs.writeFileSync(emailsPackageJson, pkgContent, 'utf8');
                log('   ✅ Updated emails.package.json with default content', 'green');
            } else {
                // Read existing content
                pkgContent = fs.readFileSync(emailsPackageJson, 'utf8');
                
                // Validate JSON
                try {
                    JSON.parse(pkgContent);
                    log(`   ✅ Using existing emails.package.json (${sourceStats.size} bytes)`, 'reset');
                } catch (e) {
                    log('   ⚠️  emails.package.json has invalid JSON, using default template...', 'yellow');
                    pkgContent = JSON.stringify(defaultPackageJson, null, 2);
                    // Fix the invalid file
                    fs.writeFileSync(emailsPackageJson, pkgContent, 'utf8');
                    log('   ✅ Fixed emails.package.json with valid JSON', 'green');
                }
            }
        }

        // Write to destination
        fs.writeFileSync(destPackageJson, pkgContent, 'utf8');
        
        // Verify the copy
        if (!fs.existsSync(destPackageJson)) {
            error('Failed to create package.json in package directory');
        }
        
        const copiedContent = fs.readFileSync(destPackageJson, 'utf8');
        
        if (copiedContent.length === 0) {
            error('package.json was created but is empty');
        }
        
        success(`package.json ready (${copiedContent.length} bytes)`);

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