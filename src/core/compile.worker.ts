import { MarkDrawCompiler } from './compiler';
import { CompilationOptions, CompilationResult } from './types';

export interface CompileWorkerRequest {
  compileId: number;
  shapes: any[];
  options?: CompilationOptions;
}

export interface CompileWorkerResponse {
  compileId: number;
  result: CompilationResult;
  durationMs: number;
}

self.onmessage = (e: MessageEvent<CompileWorkerRequest>) => {
  const { compileId, shapes, options } = e.data;
  const start = performance.now();

  try {
    const result = MarkDrawCompiler.compile(shapes, null, options);
    const durationMs = Math.round(performance.now() - start);

    const response: CompileWorkerResponse = {
      compileId,
      result,
      durationMs
    };

    self.postMessage(response);
  } catch (err: any) {
    console.error('[CompileWorker] Error during background compile:', err);
    // Post back empty result with error status
    self.postMessage({
      compileId,
      error: err?.message || 'Compile failed',
      durationMs: Math.round(performance.now() - start)
    });
  }
};
