#!/usr/bin/env node
/**
 * Desktop Extension Builder for Apple Dev MCP
 * 
 * Packages the MCP server as a Claude Desktop Extension (.dxt file)
 * for one-click installation.
 */

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function buildExtension() {
  console.log('🏗️  Building Apple Dev MCP Desktop Extension...\n');

  const buildDir = path.join(projectRoot, 'dist-extension');
  const outputFile = path.join(projectRoot, 'apple-dev-mcp.dxt');

  try {
    // Clean and create build directory
    console.log('📁 Preparing build directory...');
    await fs.rm(buildDir, { recursive: true, force: true });
    await fs.mkdir(buildDir, { recursive: true });

    // Copy essential files
    console.log('📋 Copying essential files...');
    
    // Copy manifest
    await fs.copyFile(
      path.join(projectRoot, 'manifest.json'),
      path.join(buildDir, 'manifest.json')
    );

    // Copy built distribution
    console.log('📦 Copying dist/ directory...');
    await copyDirectory(
      path.join(projectRoot, 'dist'),
      path.join(buildDir, 'dist')
    );

    // Copy static content
    console.log('📚 Copying content/ directory...');
    await copyDirectory(
      path.join(projectRoot, 'content'),
      path.join(buildDir, 'content')
    );

    // Copy essential package files (not full node_modules)
    console.log('📄 Copying package.json...');
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8')
    );
    
    // Create a minimal package.json for the extension
    const extensionPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      main: packageJson.main,
      type: packageJson.type,
      engines: packageJson.engines,
      dependencies: filterProductionDependencies(packageJson.dependencies || {}),
      author: packageJson.author,
      license: packageJson.license
    };

    await fs.writeFile(
      path.join(buildDir, 'package.json'),
      JSON.stringify(extensionPackageJson, null, 2)
    );

    // Copy README and LICENSE
    console.log('📖 Copying documentation...');
    try {
      await fs.copyFile(
        path.join(projectRoot, 'README.md'),
        path.join(buildDir, 'README.md')
      );
    } catch (error) {
      console.warn('⚠️  README.md not found, skipping...');
    }

    try {
      await fs.copyFile(
        path.join(projectRoot, 'LICENSE'),
        path.join(buildDir, 'LICENSE')
      );
    } catch (error) {
      console.warn('⚠️  LICENSE not found, skipping...');
    }

    // Copy icon if it exists
    console.log('🎨 Looking for icon...');
    const iconFiles = ['icon.png', 'icon.svg', 'icon.ico'];
    let iconCopied = false;
    
    for (const iconFile of iconFiles) {
      try {
        await fs.copyFile(
          path.join(projectRoot, iconFile),
          path.join(buildDir, 'icon.png') // Always name it icon.png in the extension
        );
        console.log(`✅ Copied ${iconFile} as icon.png`);
        iconCopied = true;
        break;
      } catch (error) {
        // Icon file doesn't exist, continue
      }
    }

    if (!iconCopied) {
      console.log('ℹ️  No icon found, creating placeholder...');
      await createPlaceholderIcon(path.join(buildDir, 'icon.png'));
    }

    // Create the .dxt archive
    console.log('📦 Creating .dxt archive...');
    await createArchive(buildDir, outputFile);

    // Validate the extension
    console.log('✅ Validating extension...');
    await validateExtension(buildDir);

    // Clean up build directory
    console.log('🧹 Cleaning up...');
    await fs.rm(buildDir, { recursive: true, force: true });

    // Get file size
    const stats = await fs.stat(outputFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('\n🎉 Desktop Extension built successfully!');
    console.log(`📦 File: ${outputFile}`);
    console.log(`📏 Size: ${fileSizeMB} MB`);
    console.log('\n🚀 Installation Instructions:');
    console.log('1. Download the apple-dev-mcp.dxt file');
    console.log('2. Double-click to install in Claude Desktop');
    console.log('3. Restart Claude Desktop');
    console.log('4. Start using Apple development guidance!');

  } catch (error) {
    console.error('❌ Extension build failed:', error);
    process.exit(1);
  }
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const items = await fs.readdir(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = await fs.stat(srcPath);

    if (stat.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function filterProductionDependencies(dependencies) {
  // Only include essential runtime dependencies
  const productionDeps = {};
  const essentialPackages = [
    '@modelcontextprotocol/sdk',
    '@crawlee/playwright',
    'playwright',
    'node-cache',
    'turndown',
    'compromise'
  ];

  for (const [name, version] of Object.entries(dependencies)) {
    if (essentialPackages.some(pkg => name.startsWith(pkg))) {
      productionDeps[name] = version;
    }
  }

  return productionDeps;
}

async function createArchive(sourceDir, outputFile) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ Archive created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function validateExtension(buildDir) {
  // Check required files
  const requiredFiles = ['manifest.json', 'dist/server.js', 'package.json'];
  
  for (const file of requiredFiles) {
    const filePath = path.join(buildDir, file);
    try {
      await fs.access(filePath);
      console.log(`✅ ${file} exists`);
    } catch (error) {
      throw new Error(`Required file missing: ${file}`);
    }
  }

  // Validate manifest
  const manifestPath = path.join(buildDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  
  if (!manifest.dxt_version) {
    throw new Error('Manifest missing dxt_version');
  }
  
  if (!manifest.server || !manifest.server.entry_point) {
    throw new Error('Manifest missing server.entry_point');
  }

  console.log('✅ Extension validation passed');
}

async function createPlaceholderIcon(iconPath) {
  // Create a simple SVG icon and save as PNG placeholder
  const svgIcon = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" fill="#007AFF" rx="12"/>
    <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">🍎</text>
  </svg>`;
  
  // For now, just create a text file indicating an icon is needed
  await fs.writeFile(iconPath + '.svg', svgIcon);
  await fs.writeFile(iconPath, 'PNG placeholder - real icon needed');
}

// Run the build
if (import.meta.url === `file://${process.argv[1]}`) {
  buildExtension().catch(console.error);
}

export { buildExtension };