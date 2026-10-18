#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

const ALLOWED_TLDRAW_DIRS = [
  path.join(SRC_DIR, 'canvas', 'tldraw'),
  // Transitional during Phase 1; to be fully decoupled in Phase 2/3
  path.join(SRC_DIR, 'annotation'),
  path.join(SRC_DIR, 'core')
];

function isPathAllowedForTldraw(filePath) {
  return ALLOWED_TLDRAW_DIRS.some((dir) => filePath.startsWith(dir));
}

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
let violations = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for @tldraw import
    if (line.includes("from '@tldraw") || line.includes('from "@tldraw')) {
      if (!isPathAllowedForTldraw(file)) {
        violations.push({
          file: path.relative(process.cwd(), file),
          line: i + 1,
          text: line.trim(),
          issue: 'Direct @tldraw import outside allowed adapter directories.'
        });
      }
    }

    // Check for @excalidraw import outside canvas/excalidraw
    if (line.includes("from '@excalidraw") || line.includes('from "@excalidraw')) {
      const allowedExcalidraw = path.join(SRC_DIR, 'canvas', 'excalidraw');
      if (!file.startsWith(allowedExcalidraw)) {
        violations.push({
          file: path.relative(process.cwd(), file),
          line: i + 1,
          text: line.trim(),
          issue: 'Direct @excalidraw import outside canvas/excalidraw.'
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ Import Boundary Violations Found:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} - ${v.issue}`);
    console.error(`    ${v.text}`);
  }
  process.exit(1);
} else {
  console.log('✅ Import boundaries check passed: No unauthorized vendor imports in App shell.');
}
