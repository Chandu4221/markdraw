import { BenchmarkFixture, PromptModality, PromptPayload } from './types';
import { MarkDrawCompiler } from '../src/core/compiler';

/**
 * Deterministic BPE-calibrated token estimator.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const tokens = text.match(/\b\w+\b|[^\w\s]/g);
  return tokens ? tokens.length : Math.ceil(text.length / 4);
}

const BASE_SYSTEM_PROMPT =
  'You are an expert frontend engineer and design technologist. Your task is to generate clean, production-ready, semantic HTML5 with Tailwind CSS utility classes implementing the exact wireframe specification provided by the user.';

/**
 * Builds prompt payloads for a fixture across the specified modality.
 */
export function buildPromptPayload(
  fixture: BenchmarkFixture,
  modality: PromptModality
): PromptPayload {
  const compilation = MarkDrawCompiler.compile(fixture.shapes as any, null, {
    includeLegend: true,
    pageNote: fixture.description
  });

  let systemPrompt = BASE_SYSTEM_PROMPT;
  let userPrompt = '';

  switch (modality) {
    case 'spec': {
      systemPrompt +=
        ' Follow the MarkDraw Lean Contract strictly: honor parent-child container hierarchy, semantic HTML tags (<header>, <nav>, <section>, <button>, etc.), CSS positioning flags (sticky, fixed), and explicit width constraints. Output ONLY valid HTML.';
      userPrompt = `Please implement the following MarkDraw UI specification into a single self-contained HTML5 file with Tailwind CSS.\n\n${compilation.markdownSpec}\n\nStrict Requirements:\n1. Adhere strictly to the Path hierarchy and container nesting.\n2. Apply appropriate semantic HTML elements.\n3. Implement layout constraints, sticky/fixed behavior, and width classes exactly as specified.\n4. Output only clean HTML markup without explanations.`;
      break;
    }
    case 'baseline': {
      systemPrompt +=
        ' Interpret the visual ASCII layout diagram and spatial positioning. Infer layout containers and Tailwind CSS classes. Output ONLY valid HTML.';
      userPrompt = `Please implement the following wireframe layout diagram into a single self-contained HTML5 file with Tailwind CSS.\n\nWireframe Description: ${fixture.name} (${fixture.description})\n\nASCII Layout Wireframe:\n\`\`\`\n${compilation.markdownAscii}\n\`\`\`\n\nRequirements:\n1. Recreate the visual layout shown in the diagram.\n2. Output only clean HTML markup with Tailwind CSS classes.`;
      break;
    }
    case 'ast': {
      systemPrompt +=
        ' Interpret the raw JSON Abstract Syntax Tree (AST) layout nodes and bounding boxes to reconstruct the page with Tailwind CSS. Output ONLY valid HTML.';
      userPrompt = `Please implement the following JSON AST wireframe into a single self-contained HTML5 file with Tailwind CSS.\n\nWireframe Description: ${fixture.name}\n\nJSON AST:\n\`\`\`json\n${compilation.jsonAst}\n\`\`\`\n\nRequirements:\n1. Reconstruct the page elements and layout from the AST nodes.\n2. Output only clean HTML markup with Tailwind CSS classes.`;
      break;
    }
  }

  const estimatedPromptTokens =
    estimateTokens(systemPrompt) + estimateTokens(userPrompt);

  return {
    modality,
    fixtureId: fixture.id,
    systemPrompt,
    userPrompt,
    estimatedPromptTokens
  };
}
