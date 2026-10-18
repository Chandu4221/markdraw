#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const MAX_LINES = 500;
const WARN_LINES = 400;

// Legacy files: untouchable core compiler/legend files (§12) or MarkdownPreview
const LEGACY_ALLOWLIST = new Set([
  'src/core/ir.ts',
  'src/core/compiler.ts',
  'src/components/MarkdownPreview.tsx',
  'src/core/legend.ts',
  'src/core/notation.ts'
]);

function scanFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(scanFiles(fullPath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = scanFiles(SRC_DIR);
let errors = [];
let warnings = [];
let legacyCount = 0;

for (const file of allFiles) {
  const relPath = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, 'utf-8');
  const lineCount = content.split('\n').length;

  if (LEGACY_ALLOWLIST.has(relPath)) {
    legacyCount++;
    continue;
  }

  if (lineCount > MAX_LINES) {
    errors.push({ file: relPath, lines: lineCount });
  } else if (lineCount >= WARN_LINES) {
    warnings.push({ file: relPath, lines: lineCount });
  }
}

console.log('--- MarkDraw File Size Audit (§9.4) ---');
console.log(`Scanned ${allFiles.length} files. (${legacyCount} legacy files tracked for Phase 2 decomposition)`);

if (warnings.length > 0) {
  console.log('\n⚠️ Warnings (>= 400 lines):');
  for (const w of warnings) {
    console.log(`  ${w.file} (${w.lines} lines)`);
  }
}

if (errors.length > 0) {
  console.error('\n❌ File Size Violations (> 500 lines):');
  for (const err of errors) {
    console.error(`  ${err.file} (${err.lines} lines - maximum allowed is ${MAX_LINES})`);
  }
  process.exit(1);
} else {
  console.log('✅ File size check passed: All new and non-legacy files are ≤ 500 lines.');
}
