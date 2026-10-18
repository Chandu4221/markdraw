import fs from 'fs';
import path from 'path';
import { MarkDrawCompiler } from '../core/compiler';
import { CompilationOptions } from '../core/types';
import { StoredDocument } from '../canvas/port/PersistencePort';
import { CanvasShape } from '../canvas/port/CanvasShape';

export interface CliOptions {
  root?: string;
  platform?: string;
  scope?: string;
  json?: boolean;
}

export function canvasShapesToCompilerShapes(canvasShapes: CanvasShape[]): any[] {
  return canvasShapes.map((s) => ({
    id: s.id,
    type: s.kind === 'frame' ? 'frame' : s.kind === 'group' ? 'group' : 'geo',
    x: s.bounds.x,
    y: s.bounds.y,
    rotation: s.bounds.rotation || 0,
    parentId: s.parentId,
    props: {
      geo: s.kind === 'ellipse' ? 'ellipse' : s.kind === 'diamond' ? 'diamond' : 'rectangle',
      w: s.bounds.w,
      h: s.bounds.h,
      text: s.text,
      name: s.name
    },
    meta: s.meta
  }));
}

export function compileStoredDocument(
  doc: StoredDocument,
  options: CliOptions = {}
): string {
  const compilerShapes = canvasShapesToCompilerShapes(doc.shapes);

  let scopeConfig: CompilationOptions['scope'] = null;

  if (options.root) {
    const targetRoot = doc.shapes.find(
      (s) =>
        s.id === options.root ||
        s.name === options.root ||
        s.text === options.root ||
        (s.meta?.markdraw as any)?.props?.label === options.root
    );
    if (!targetRoot) {
      throw new Error(`Root shape not found matching "${options.root}"`);
    }
    const label =
      targetRoot.name ||
      (targetRoot.meta?.markdraw as any)?.props?.label ||
      targetRoot.id;
    scopeConfig = {
      shapeIds: [targetRoot.id],
      scopeName: label
    };
  } else if (options.scope && options.scope !== 'all') {
    scopeConfig = {
      shapeIds: [options.scope]
    };
  }

  const compileOpts: CompilationOptions = {
    units: doc.units || [],
    platformId: options.platform || 'web',
    scope: scopeConfig
  };

  const result = MarkDrawCompiler.compile(compilerShapes, null, compileOpts);
  return options.json ? result.jsonAst : result.markdownSpec;
}

export function parseArgs(argv: string[]): {
  command?: string;
  filePath?: string;
  options: CliOptions;
} {
  const args = argv.slice(2);
  let command: string | undefined;
  let filePath: string | undefined;
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'compile') {
      command = 'compile';
    } else if (arg === '--root' && i + 1 < args.length) {
      options.root = args[++i];
    } else if (arg === '--platform' && i + 1 < args.length) {
      options.platform = args[++i];
    } else if (arg === '--scope' && i + 1 < args.length) {
      options.scope = args[++i];
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      command = 'help';
    } else if (arg === '--version' || arg === '-v') {
      command = 'version';
    } else if (!arg.startsWith('-') && !filePath) {
      filePath = arg;
    }
  }

  return { command: command || (filePath ? 'compile' : 'help'), filePath, options };
}

export function runCli(argv: string[] = process.argv): void {
  const { command, filePath, options } = parseArgs(argv);

  if (command === 'help') {
    console.log(`
MarkDraw v5 CLI — Headless Compiler

Usage:
  markdraw compile <file.md.json> [options]

Options:
  --root <id|name>               Root frame or container to compile
  --platform <web|android-material>  Target platform profile (default: web)
  --scope <all|id>               Scope compilation to all or specific shape
  --json                         Emit JSON AST instead of Markdown contract
  --help, -h                     Show this help message
  --version, -v                  Show version
`);
    process.exit(0);
  }

  if (command === 'version') {
    console.log('markdraw v5.0.0');
    process.exit(0);
  }

  if (command === 'compile') {
    if (!filePath) {
      console.error('Error: Please specify an input document file path.');
      process.exit(1);
    }

    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: File not found: ${resolvedPath}`);
      process.exit(1);
    }

    try {
      const raw = fs.readFileSync(resolvedPath, 'utf-8');
      const doc = JSON.parse(raw) as StoredDocument;
      const output = compileStoredDocument(doc, options);
      process.stdout.write(output + (output.endsWith('\n') ? '' : '\n'));
      process.exit(0);
    } catch (err: any) {
      console.error(`Compilation Error: ${err.message || err}`);
      process.exit(1);
    }
  }
}

// Execute if run directly from node/vite-node
if (
  process.argv[1] &&
  (process.argv[1].endsWith('compile.ts') || process.argv[1].endsWith('markdraw'))
) {
  runCli();
}
