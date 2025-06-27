#!/usr/bin/env node

/**
 * Content Restructure Script
 * 
 * Executes the restructuring of content from platform-first to topic-first organization
 */

import path from 'path';
import { ContentRestructureService } from '../services/content-restructure.service.js';

async function main() {
  console.log('🍎 Apple HIG Content Restructure');
  console.log('=================================');
  console.log('Restructuring from platform-first to topic-first organization...\n');

  const projectRoot = path.resolve(process.cwd());
  const config = {
    currentContentDir: path.join(projectRoot, 'content'),
    newContentDir: path.join(projectRoot, 'content-restructured'),
    backupDir: path.join(projectRoot, 'backups')
  };

  const restructureService = new ContentRestructureService(config);

  try {
    // 1. Create restructure plan
    console.log('📋 Creating restructure plan...');
    const plan = await restructureService.createRestructurePlan();
    
    console.log('\n📊 Restructure Plan Summary:');
    console.log('============================');
    console.log(`🌍 Universal topics to move: ${plan.universalTopicsToMove.length}`);
    console.log(`🔄 Universal topics to consolidate: ${plan.universalTopicsToConsolidate.length}`);
    console.log(`📱 Platform-specific topics to keep: ${plan.platformSpecificTopicsToKeep.length}`);
    console.log(`🗑️ Duplicate files to remove: ${plan.filesToDelete.length}`);

    console.log('\n🔄 Topics to consolidate:');
    for (const consolidation of plan.universalTopicsToConsolidate) {
      console.log(`   • ${consolidation.topic} (${consolidation.duplicateFiles.length} files → 1 universal file)`);
      console.log(`     Best source: ${consolidation.bestSourcePlatform}`);
    }

    // 2. Ask for confirmation
    if (process.argv.includes('--dry-run')) {
      console.log('\n🔍 Dry run completed. Use --execute to perform restructure.');
      return;
    }

    if (!process.argv.includes('--execute')) {
      console.log('\n⚠️  This will restructure your content directory!');
      console.log('   Add --execute to perform the restructure, or --dry-run to preview.');
      return;
    }

    // 3. Execute restructure
    console.log('\n🚀 Executing restructure...');
    await restructureService.executeRestructure(plan);

    // 4. Show results
    console.log('\n✅ Content restructure completed successfully!');
    console.log('\n📁 New Structure:');
    console.log('   content-restructured/');
    console.log('   ├── {topic}.md           # Universal topics at root');
    console.log('   ├── platforms/');
    console.log('   │   ├── ios/{topic}.md   # iOS-specific topics');
    console.log('   │   ├── macos/{topic}.md # macOS-specific topics');
    console.log('   │   └── ...              # Other platform-specific topics');
    console.log('   └── metadata/            # Search indices and metadata');

    console.log('\n🔍 Search Benefits:');
    console.log('   • Universal topics are now discoverable at the root level');
    console.log('   • Cross-platform searches will find unified content');
    console.log('   • Platform-specific content remains properly categorized');
    console.log('   • Search index can now be topic-based instead of platform-based');

    console.log('\n🔧 Next Steps:');
    console.log('   1. Update content generation to use new structure');
    console.log('   2. Rebuild search index for topic-based discovery');
    console.log('   3. Update MCP resources to use topic-based URIs');
    console.log('   4. Test with searches like "liquid glass" to verify improvements');

  } catch (error) {
    console.error('❌ Restructure failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log('Apple HIG Content Restructure Tool');
  console.log('');
  console.log('Usage:');
  console.log('  tsx src/scripts/restructure-content.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run   Preview the restructure plan without making changes');
  console.log('  --execute   Execute the restructure (creates backup first)');
  console.log('  --help      Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  tsx src/scripts/restructure-content.ts --dry-run');
  console.log('  tsx src/scripts/restructure-content.ts --execute');
  process.exit(0);
}

main().catch(console.error);