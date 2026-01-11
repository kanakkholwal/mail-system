#!/usr/bin/env node

/**
 * Analyze package size and contents
 */

const fs = require('fs');
const path = require('path');

const PACKAGE_DIR = path.join(__dirname, '..', 'package');
const DIST_DIR = path.join(PACKAGE_DIR, 'dist');

function formatBytes(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB';
}

function getDirectorySize(dirPath) {
    let totalSize = 0;
    const files = {};

    function traverse(currentPath) {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                traverse(itemPath);
            } else {
                const ext = path.extname(item);
                const relativePath = path.relative(DIST_DIR, itemPath);
                
                totalSize += stats.size;
                
                if (!files[ext]) {
                    files[ext] = { count: 0, size: 0, examples: [] };
                }
                
                files[ext].count++;
                files[ext].size += stats.size;
                
                if (files[ext].examples.length < 3) {
                    files[ext].examples.push({
                        name: relativePath,
                        size: stats.size
                    });
                }
            }
        }
    }

    if (fs.existsSync(dirPath)) {
        traverse(dirPath);
    }

    return { totalSize, files };
}

console.log('\n📊 Package Size Analysis\n');
console.log('='.repeat(60));

if (!fs.existsSync(DIST_DIR)) {
    console.log('❌ Package not built yet. Run: bun run build:package');
    process.exit(1);
}

const { totalSize, files } = getDirectorySize(DIST_DIR);

console.log(`\n📦 Total Package Size: ${formatBytes(totalSize)}\n`);

// Sort by size
const sortedExts = Object.entries(files).sort((a, b) => b[1].size - a[1].size);

console.log('📄 Breakdown by file type:\n');

for (const [ext, data] of sortedExts) {
    const percentage = ((data.size / totalSize) * 100).toFixed(1);
    console.log(`${ext || '(no ext)'}: ${formatBytes(data.size)} (${percentage}%) - ${data.count} files`);
    
    if (data.examples.length > 0) {
        data.examples.forEach(ex => {
            console.log(`   → ${ex.name}: ${formatBytes(ex.size)}`);
        });
    }
}

console.log('\n' + '='.repeat(60));

// Recommendations
console.log('\n💡 Optimization Recommendations:\n');

if (files['.map']) {
    const savings = formatBytes(files['.map'].size);
    console.log(`• Remove source maps (.map files) → Save ${savings}`);
    console.log('  Add "sourcemap: false" to tsup.config.ts\n');
}

if (files['.mjs'] && files['.js']) {
    console.log('• You have both ESM (.mjs) and CJS (.js) formats');
    console.log('  This is normal for dual-format packages\n');
}

if (files['.d.ts'] && files['.d.mts']) {
    const dtsSize = (files['.d.ts'].size + files['.d.mts'].size);
    console.log(`• TypeScript declarations: ${formatBytes(dtsSize)}`);
    console.log('  This is necessary for TypeScript support\n');
}

console.log('\nRun with optimizations: bun run build:package:optimized\n');