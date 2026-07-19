#!/usr/bin/env node
import { IMPORT_PRESETS, getPreset, listPresets } from './config/import-presets.js';
import { runImport, getTrackStats } from './engine/unified-importer.js';
import { runPostImportPipeline } from './pipeline/post-import.js';
import { normalizeGenres, classifyAllUncategorized, removeDuplicates } from './pipeline/normalizer.js';
import { runHealthCheck, getQuickStats } from './monitor/health-monitor.js';

const args = process.argv.slice(2);
const command = args[0];
const flags: Record<string, string> = {};
for (let i = 1; i < args.length; i += 2) {
  if (args[i]?.startsWith('--')) {
    flags[args[i].slice(2)] = args[i + 1];
  }
}

async function main() {
  console.log('🤖 AI Agent Orchestrator v1.0\n');

  switch (command) {
    case 'import': {
      const presetName = flags.preset;
      const folderId = flags.folder;
      const genre = flags.genre;
      const price = parseFloat(flags.price || '0.60');

      if (presetName) {
        const preset = getPreset(presetName);
        if (!preset) {
          console.log(`❌ Preset "${presetName}" not found.`);
          console.log(`Available presets: ${listPresets().join(', ')}`);
          return;
        }
        const result = await runImport(preset);
        if (result.imported > 0) {
          console.log('\n🔄 Running post-import pipeline...');
          await runPostImportPipeline();
        }
      } else if (folderId && genre) {
        const customPreset = {
          name: genre,
          folderId,
          genre,
          price,
          parseStrategy: 'standard' as const,
          extractArtwork: true,
          recursive: flags.recursive === 'true',
        };
        const result = await runImport(customPreset);
        if (result.imported > 0) {
          console.log('\n🔄 Running post-import pipeline...');
          await runPostImportPipeline();
        }
      } else {
        console.log('Usage:');
        console.log('  import --preset <name>');
        console.log('  import --folder <FOLDER_ID> --genre "Genre" [--price 0.60]');
        console.log(`\nAvailable presets: ${listPresets().join(', ')}`);
      }
      break;
    }

    case 'presets': {
      console.log('📋 Available Import Presets:\n');
      for (const [key, preset] of Object.entries(IMPORT_PRESETS)) {
        console.log(`  ${key.padEnd(20)} | ${preset.genre.padEnd(20)} | $${preset.price.toFixed(2)} | Folder: ${preset.folderId}`);
      }
      break;
    }

    case 'health': {
      const report = await runHealthCheck();
      console.log('\n🏥 Health Report:');
      console.log(`  Score: ${report.score}/100`);
      console.log(`  Total tracks: ${report.totalTracks}`);
      console.log(`  Issues: ${report.issues.length}`);
      for (const issue of report.issues) {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️';
        console.log(`  ${icon} ${issue.message}`);
      }
      break;
    }

    case 'stats': {
      await getQuickStats();
      break;
    }

    case 'normalize': {
      const count = await normalizeGenres();
      console.log(`\n✅ Normalized ${count} tracks`);
      break;
    }

    case 'classify': {
      const count = await classifyAllUncategorized();
      console.log(`\n✅ Reclassified ${count} tracks`);
      break;
    }

    case 'dedup': {
      const result = await removeDuplicates();
      console.log(`\n✅ Kept ${result.kept}, Deleted ${result.deleted}`);
      break;
    }

    case 'pipeline': {
      await runPostImportPipeline();
      break;
    }

    case 'fix-artwork': {
      console.log('🖼️ Fixing artwork...');
      const { execSync } = await import('child_process');
      execSync('npx tsx server/src/scripts/fixArtwork.ts', { stdio: 'inherit', cwd: process.cwd() });
      break;
    }

    case 'fix-all': {
      console.log('🔧 Running all fixes...\n');
      await normalizeGenres();
      await classifyAllUncategorized();
      const dedup = await removeDuplicates();
      console.log(`\n✅ All fixes complete. Deleted ${dedup.deleted} duplicates.`);
      break;
    }

    case 'full-audit': {
      console.log('🔍 Running full audit...\n');

      console.log('--- Health Check ---');
      const report = await runHealthCheck();
      console.log(`  Score: ${report.score}/100`);

      console.log('\n--- Genre Normalization ---');
      const normCount = await normalizeGenres();
      console.log(`  Normalized: ${normCount}`);

      console.log('\n--- Classify Uncategorized ---');
      const classCount = await classifyAllUncategorized();
      console.log(`  Reclassified: ${classCount}`);

      console.log('\n--- Remove Duplicates ---');
      const dedup = await removeDuplicates();
      console.log(`  Deleted: ${dedup.deleted}`);

      console.log('\n--- Final Stats ---');
      await getQuickStats();
      break;
    }

    default: {
      console.log('🤖 AI Agent Orchestrator - Commands:\n');
      console.log('  import --preset <name>           Import using a preset');
      console.log('  import --folder <ID> --genre <G> Import custom folder');
      console.log('  presets                          List all presets');
      console.log('  health                           Run health check');
      console.log('  stats                            Show system stats');
      console.log('  normalize                        Normalize genres');
      console.log('  classify                         Classify Uncategorized');
      console.log('  dedup                            Remove duplicates');
      console.log('  pipeline                         Run full post-import pipeline');
      console.log('  fix-artwork                      Fix artwork issues');
      console.log('  fix-all                          Run all fixes');
      console.log('  full-audit                       Complete system audit');
      break;
    }
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
