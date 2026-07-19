import { normalizeGenres, classifyAllUncategorized, removeDuplicates } from './normalizer.js';

export interface PipelineResult {
  step: string;
  success: boolean;
  details: string;
  count: number;
}

export async function runPostImportPipeline(): Promise<PipelineResult[]> {
  console.log('\n🔄 Running Post-Import Pipeline...\n');
  const results: PipelineResult[] = [];

  // Step 1: Normalize genres
  try {
    const count = await normalizeGenres();
    results.push({ step: 'normalize-genres', success: true, details: `Normalized ${count} tracks`, count });
  } catch (err: any) {
    results.push({ step: 'normalize-genres', success: false, details: err.message, count: 0 });
  }

  // Step 2: Classify uncategorized
  try {
    const count = await classifyAllUncategorized();
    results.push({ step: 'classify-uncategorized', success: true, details: `Reclassified ${count} tracks`, count });
  } catch (err: any) {
    results.push({ step: 'classify-uncategorized', success: false, details: err.message, count: 0 });
  }

  // Step 3: Remove duplicates
  try {
    const { kept, deleted } = await removeDuplicates();
    results.push({ step: 'remove-duplicates', success: true, details: `Kept ${kept}, Deleted ${deleted}`, count: deleted });
  } catch (err: any) {
    results.push({ step: 'remove-duplicates', success: false, details: err.message, count: 0 });
  }

  console.log('\n📊 Pipeline Results:');
  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`  ${icon} ${r.step}: ${r.details}`);
  }

  return results;
}
