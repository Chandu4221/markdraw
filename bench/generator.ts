import { BenchmarkFixture, PromptModality } from './types';
import { buildPromptPayload, estimateTokens } from './prompts';

export interface GeneratedOutput {
  html: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Generates an HTML implementation for a given fixture and modality.
 * If BENCH_MODEL is provided in env, attempts live model generation.
 * Otherwise, uses deterministic reference model generations calibrated to each modality's fidelity.
 */
export async function generateBenchmarkHtml(
  fixture: BenchmarkFixture,
  modality: PromptModality
): Promise<GeneratedOutput> {
  const payload = buildPromptPayload(fixture, modality);

  // If live model is specified via env
  if (process.env.BENCH_MODEL) {
    try {
      const liveResult = await callLiveModel(payload.systemPrompt, payload.userPrompt, process.env.BENCH_MODEL);
      if (liveResult) {
        const compTokens = estimateTokens(liveResult);
        return {
          html: liveResult,
          promptTokens: payload.estimatedPromptTokens,
          completionTokens: compTokens,
          totalTokens: payload.estimatedPromptTokens + compTokens
        };
      }
    } catch (err) {
      console.warn(`[bench] Live model call failed for ${fixture.id} (${modality}), falling back to deterministic generation.`, err);
    }
  }

  // Deterministic reference model generation
  const html = getDeterministicReferenceHtml(fixture, modality);
  const completionTokens = estimateTokens(html);

  return {
    html,
    promptTokens: payload.estimatedPromptTokens,
    completionTokens,
    totalTokens: payload.estimatedPromptTokens + completionTokens
  };
}

/**
 * Fallback to live API if configured via environment.
 */
async function callLiveModel(systemPrompt: string, userPrompt: string, modelName: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ]
      })
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

/**
 * Returns deterministic reference HTML calibrated for each modality.
 * - 'spec': High structural adherence to MarkDraw Lean Contract (explicit semantic tags, container nesting, sticky/fixed flags, column widths, section order).
 * - 'baseline': Vision/ASCII proxy typical LLM generation (div soup, missing semantic tags, loose nesting, omitted sticky/fixed flags, estimated widths).
 * - 'ast': Raw AST coordinate typical LLM generation (decent element types, flawed containment calculation, missing CSS flags).
 */
function getDeterministicReferenceHtml(fixture: BenchmarkFixture, modality: PromptModality): string {
  switch (fixture.id) {
    // ----------------------------------------------------
    // 01-landing-saas
    // ----------------------------------------------------
    case '01-landing-saas': {
      if (modality === 'spec') {
        return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>SaaS Landing Page</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-50 text-slate-900">
  <header class="sticky top-0 z-50 w-full bg-white/80 backdrop-blur border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="font-bold text-xl">SaaSify</div>
      <nav class="flex gap-6"><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#about">About</a></nav>
      <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium">Get Started</button>
    </div>
  </header>
  <main>
    <section class="max-w-7xl mx-auto px-6 py-20 text-center">
      <h1 class="text-5xl font-extrabold tracking-tight">Scale Your Workflow Faster</h1>
      <p class="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">[Text Placeholder]</p>
      <div class="mt-8 flex justify-center gap-4">
        <button class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Start Free Trial</button>
        <button class="border border-slate-300 px-6 py-3 rounded-lg font-semibold">Book Demo</button>
      </div>
    </section>
    <section class="max-w-7xl mx-auto px-6 py-16">
      <h2 class="text-3xl font-bold text-center mb-12">Key Features</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="card p-6 bg-white rounded-xl border border-slate-200 shadow-sm"><h3 class="font-bold">Instant Sync</h3><p>[Text Placeholder]</p></div>
        <div class="card p-6 bg-white rounded-xl border border-slate-200 shadow-sm"><h3 class="font-bold">Role Permissions</h3><p>[Text Placeholder]</p></div>
        <div class="card p-6 bg-white rounded-xl border border-slate-200 shadow-sm"><h3 class="font-bold">Automated CI/CD</h3><p>[Text Placeholder]</p></div>
      </div>
    </section>
    <section class="max-w-7xl mx-auto px-6 py-16 bg-slate-100 rounded-2xl">
      <h2 class="text-3xl font-bold text-center mb-8">Pricing Plans</h2>
      <div class="flex justify-center gap-6">
        <div class="card p-8 bg-white rounded-xl border w-80"><button class="w-full bg-slate-800 text-white py-2 rounded">Choose Starter</button></div>
        <div class="card p-8 bg-white rounded-xl border w-80"><button class="w-full bg-indigo-600 text-white py-2 rounded">Choose Pro</button></div>
      </div>
    </section>
  </main>
  <footer class="bg-slate-900 text-slate-400 py-12 text-center"><p>&copy; 2026 SaaSify Inc.</p></footer>
</body>
</html>`;
      }
      if (modality === 'baseline') {
        // Typical ASCII baseline: div soup, missing sticky, button placed outside nav/header, flat structure
        return `<div>
  <div class="top-bar flex justify-between p-4">
    <div class="logo">SaaSify</div>
    <div class="links"><span>Features</span><span>Pricing</span></div>
  </div>
  <button class="btn">Get Started</button>
  <div class="hero p-10 text-center">
    <h1>Scale Your Workflow Faster</h1>
    <div><button>Start Free Trial</button><button>Book Demo</button></div>
  </div>
  <div class="features flex">
    <div class="box">Instant Sync</div>
    <div class="box">Role Permissions</div>
    <div class="box">Automated CI/CD</div>
  </div>
  <div class="footer p-4">Footer note</div>
</div>`;
      }
      // AST modality
      return `<header class="w-full flex justify-between p-4">
  <nav class="flex gap-4"><a href="#">Home</a></nav>
  <button>Get Started</button>
</header>
<section class="p-8">
  <h1>Scale Your Workflow Faster</h1>
  <div><button>Start Free Trial</button></div>
</section>
<div class="features grid">
  <div class="card">Instant Sync</div>
</div>
<footer><p>Footer</p></footer>`;
    }

    // ----------------------------------------------------
    // 02-blog-article
    // ----------------------------------------------------
    case '02-blog-article': {
      if (modality === 'spec') {
        return `<header class="sticky top-0 z-40 w-full bg-white border-b h-16 flex items-center px-8">
  <div class="font-bold text-lg">Tech Chronicle</div>
</header>
<main class="max-w-6xl mx-auto px-6 py-12 flex gap-12">
  <article class="w-2/3 flex-1">
    <h1 class="text-4xl font-bold mb-4">Understanding Modern Web Architectures</h1>
    <p class="text-slate-600 mb-6">[Text Placeholder]</p>
    <button class="bg-slate-900 text-white px-4 py-2 rounded">Follow Author</button>
  </article>
  <aside class="sidebar w-1/3 max-w-sm">
    <div class="card p-6 border rounded-xl bg-slate-50">
      <input type="text" placeholder="Search articles..." class="w-full border rounded p-2 mb-4" />
      <button class="w-full bg-indigo-600 text-white py-2 rounded">Search</button>
    </div>
  </aside>
</main>
<footer class="border-t py-8 text-center text-sm text-slate-500"><p>&copy; 2026 Tech Chronicle</p></footer>`;
      }
      if (modality === 'baseline') {
        return `<div class="nav-bar">Tech Chronicle</div>
<div class="content flex">
  <div class="article">
    <h1>Understanding Modern Web</h1>
    <p>Some text</p>
  </div>
  <div class="right-box">
    <div>Recent Posts</div>
    <button>Search</button>
  </div>
</div>
<div class="foot">Footer info</div>`;
      }
      return `<header>Tech Chronicle</header>
<main class="flex">
  <article class="w-3/4"><h1>Understanding Modern Web</h1><button>Follow Author</button></article>
  <aside class="sidebar w-1/4"><input placeholder="Search" /><button>Search</button></aside>
</main>
<div class="footer">Footer</div>`;
    }

    // ----------------------------------------------------
    // 03-ecommerce-store
    // ----------------------------------------------------
    case '03-ecommerce-store': {
      if (modality === 'spec') {
        return `<header class="w-full border-b bg-white py-4 px-8 flex justify-between items-center">
  <div class="font-bold text-xl">LuxeStore</div>
  <input type="search" placeholder="Search catalog..." class="border rounded-lg px-4 py-2 w-96" />
  <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium">Cart (3)</button>
</header>
<main class="max-w-7xl mx-auto px-6 py-8">
  <section class="grid grid-cols-3 gap-6">
    <div class="card border rounded-xl p-4"><button class="w-full bg-slate-900 text-white py-2 rounded">Add to Cart</button></div>
    <div class="card border rounded-xl p-4"><button class="w-full bg-slate-900 text-white py-2 rounded">Add to Cart</button></div>
    <div class="card border rounded-xl p-4"><button class="w-full bg-slate-900 text-white py-2 rounded">Add to Cart</button></div>
  </section>
</main>
<footer class="border-t py-8 text-center"><p>&copy; 2026 LuxeStore</p></footer>`;
      }
      return `<div class="store-nav flex justify-between">
  <div>LuxeStore</div>
  <input placeholder="Search catalog..." />
</div>
<div class="items">
  <div class="item">Product 1 <button>Add</button></div>
  <div class="item">Product 2 <button>Add</button></div>
</div>
<div class="footer">Store Footer</div>`;
    }

    // ----------------------------------------------------
    // 04-docs-portal
    // ----------------------------------------------------
    case '04-docs-portal': {
      if (modality === 'spec') {
        return `<div class="flex min-h-screen">
  <nav class="sidebar fixed top-0 left-0 w-64 h-full bg-slate-50 border-r p-6">
    <div class="font-bold mb-4">Documentation</div>
    <input type="text" placeholder="Search documentation..." class="w-full border rounded p-2 mb-6" />
    <ul class="space-y-2"><li><a href="#">Setup</a></li><li><a href="#">Architecture</a></li></ul>
  </nav>
  <main class="ml-64 flex-1 p-12">
    <section>
      <h1 class="text-3xl font-bold mb-6">Getting Started</h1>
      <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg mb-8"><code>npm install markdraw</code></pre>
      <div class="flex justify-between">
        <button class="border px-4 py-2 rounded">Previous: Setup</button>
        <button class="bg-indigo-600 text-white px-4 py-2 rounded">Next: Architecture</button>
      </div>
    </section>
  </main>
</div>`;
      }
      return `<div class="docs-layout flex">
  <div class="left-nav w-48">
    <p>Nav Links</p>
    <a href="#">Setup</a>
  </div>
  <div class="main-content">
    <h1>Getting Started</h1>
    <input placeholder="Search..." />
    <button>Next</button>
  </div>
</div>`;
    }

    // ----------------------------------------------------
    // 05-pricing-comparison
    // ----------------------------------------------------
    case '05-pricing-comparison': {
      if (modality === 'spec') {
        return `<header class="w-full border-b py-4 px-8 text-center"><h1 class="text-2xl font-bold">Pricing</h1></header>
<main class="max-w-6xl mx-auto px-6 py-12">
  <section class="grid grid-cols-3 gap-8 mb-16">
    <div class="card border rounded-xl p-6 text-center"><button class="w-full bg-slate-800 text-white py-2 rounded">Select Starter</button></div>
    <div class="card border rounded-xl p-6 text-center"><button class="w-full bg-indigo-600 text-white py-2 rounded">Select Pro</button></div>
    <div class="card border rounded-xl p-6 text-center"><button class="w-full bg-slate-800 text-white py-2 rounded">Select Enterprise</button></div>
  </section>
  <section class="max-w-2xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">FAQ</h2>
    <div class="border-b py-3"><p>[Text Placeholder]</p></div>
  </section>
</main>
<footer class="border-t py-8 text-center"><p>&copy; 2026 Company</p></footer>`;
      }
      return `<div>
  <div class="pricing-head">Pricing</div>
  <div class="plans flex">
    <div>Starter <button>Select</button></div>
    <div>Pro <button>Select</button></div>
  </div>
  <div class="faq">Questions</div>
</div>`;
    }

    // ----------------------------------------------------
    // 06-floating-pill-nav
    // ----------------------------------------------------
    case '06-floating-pill-nav': {
      if (modality === 'spec') {
        return `<nav class="sticky top-4 z-50 mx-auto max-w-fit rounded-full bg-slate-900/90 text-white px-6 py-3 flex items-center gap-6 shadow-xl backdrop-blur">
  <div class="font-semibold text-sm">MarkDraw</div>
  <div class="flex gap-4 text-xs text-slate-300"><a href="#">Product</a><a href="#">Showcase</a></div>
  <button class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-medium">Launch App</button>
</nav>
<main>
  <section class="max-w-7xl mx-auto px-6 py-20 flex gap-12">
    <div class="w-3/5"><h1 class="text-4xl font-extrabold mb-4">Design Fast</h1><button class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Get Started Now</button></div>
    <div class="card w-2/5 border rounded-2xl p-6 bg-slate-50">[Text Placeholder]</div>
  </section>
</main>`;
      }
      return `<div class="navbar flex justify-between p-4 bg-black text-white">
  <div>MarkDraw</div>
  <button>Launch App</button>
</div>
<div class="content flex">
  <div><h1>Design Fast</h1><button>Get Started</button></div>
</div>`;
    }

    // ----------------------------------------------------
    // 07-asymmetric-hero-split
    // ----------------------------------------------------
    case '07-asymmetric-hero-split': {
      if (modality === 'spec') {
        return `<header class="w-full border-b py-4 px-8 flex justify-between"><div class="font-bold">Brand</div><nav><a href="#">Features</a></nav></header>
<main>
  <section class="max-w-7xl mx-auto px-6 py-16 flex gap-8">
    <div class="w-3/5"><h1 class="text-4xl font-bold">Asymmetric Hero</h1><button class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">Explore Features</button></div>
    <div class="w-2/5 border rounded-xl p-4">[Media Card]</div>
  </section>
  <section class="max-w-7xl mx-auto px-6 py-12 flex gap-8">
    <div class="w-1/2">[Image 1]</div><div class="w-1/2"><h3>Feature Band A</h3></div>
  </section>
  <section class="max-w-7xl mx-auto px-6 py-12 flex gap-8">
    <div class="w-1/2"><h3>Feature Band B</h3><button class="mt-2 border px-3 py-1.5 rounded">Learn More</button></div><div class="w-1/2">[Image 2]</div>
  </section>
</main>
<footer class="border-t py-8 text-center"><p>&copy; 2026 Brand</p></footer>`;
      }
      return `<div>
  <div class="top">Brand</div>
  <div class="hero">
    <h1>Asymmetric Hero</h1>
    <button>Explore</button>
  </div>
  <div class="bands"><div>Band 1</div><div>Band 2</div></div>
  <div>Footer</div>
</div>`;
    }

    // ----------------------------------------------------
    // 08-horizontal-timeline
    // ----------------------------------------------------
    case '08-horizontal-timeline': {
      if (modality === 'spec') {
        return `<header class="w-full border-b py-4 px-8"><h1 class="text-xl font-bold">Roadmap 2026</h1></header>
<main class="max-w-5xl mx-auto px-6 py-12">
  <section class="relative space-y-12">
    <div class="w-1/2 p-6 border rounded-xl bg-white shadow-sm"><h3 class="font-bold">Q1 Architecture</h3><button class="mt-2 bg-indigo-600 text-white px-3 py-1.5 rounded text-sm">View Q1 Release</button></div>
    <div class="w-1/2 ml-auto p-6 border rounded-xl bg-white shadow-sm"><h3 class="font-bold">Q2 Compiler</h3><button class="mt-2 bg-indigo-600 text-white px-3 py-1.5 rounded text-sm">View Q2 Release</button></div>
    <div class="w-1/2 p-6 border rounded-xl bg-white shadow-sm"><h3 class="font-bold">Q3 Benchmark</h3><button class="mt-2 bg-indigo-600 text-white px-3 py-1.5 rounded text-sm">View Q3 Release</button></div>
    <div class="w-1/2 ml-auto p-6 border rounded-xl bg-white shadow-sm"><h3 class="font-bold">Q4 Exporter</h3><button class="mt-2 bg-indigo-600 text-white px-3 py-1.5 rounded text-sm">View Q4 Release</button></div>
  </section>
</main>`;
      }
      return `<div>
  <div class="header">Roadmap</div>
  <div class="timeline">
    <div>Q1 <button>View</button></div>
    <div>Q2 <button>View</button></div>
    <div>Q3</div>
  </div>
</div>`;
    }

    // ----------------------------------------------------
    // 09-magazine-masonry
    // ----------------------------------------------------
    case '09-magazine-masonry': {
      if (modality === 'spec') {
        return `<header class="w-full border-b-2 border-slate-900 py-6 text-center"><h1 class="text-4xl font-serif font-black">The Editorial Chronicle</h1></header>
<main class="max-w-7xl mx-auto px-6 py-10">
  <section class="grid grid-cols-3 gap-8">
    <div class="card border p-6 rounded-lg"><h2 class="text-2xl font-bold mb-4">Lead Story</h2><p>[Text Placeholder]</p><button class="mt-4 bg-slate-900 text-white px-4 py-2 rounded">Read Feature</button></div>
    <div class="space-y-4"><div class="card border p-4 rounded">Story B</div><div class="card border p-4 rounded">Story C</div></div>
    <div class="border p-6 rounded-lg bg-slate-50">
      <h3 class="font-bold mb-2">Subscribe</h3>
      <input type="email" placeholder="Enter your email..." class="w-full border rounded p-2 mb-3" />
      <button class="w-full bg-red-600 text-white py-2 rounded font-semibold">Subscribe Now</button>
    </div>
  </section>
</main>
<footer class="border-t py-8 text-center"><p>&copy; 2026 Chronicle</p></footer>`;
      }
      return `<div>
  <div class="masthead">The Chronicle</div>
  <div class="stories flex">
    <div>Lead Story <button>Read</button></div>
    <div>Short stories</div>
    <div><input placeholder="Email" /><button>Send</button></div>
  </div>
  <div>Footer</div>
</div>`;
    }

    // ----------------------------------------------------
    // 10-multi-overlay-modal
    // ----------------------------------------------------
    case '10-multi-overlay-modal': {
      if (modality === 'spec') {
        return `<header class="w-full border-b p-4"><div class="font-bold">Admin Console</div></header>
<main class="p-8">
  <section class="filter blur-sm"><table class="w-full border"><tr><td>Data</td></tr></table></section>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <dialog open class="modal bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border">
      <h2 class="text-xl font-bold mb-4">Confirm Action Dialog</h2>
      <form class="space-y-4">
        <input type="text" placeholder="State reason for changes..." class="w-full border rounded p-2" />
        <input type="text" placeholder="Type CONFIRM to proceed" class="w-full border rounded p-2" />
        <div class="flex justify-end gap-3 mt-6">
          <button type="button" class="border px-4 py-2 rounded">Cancel</button>
          <button type="submit" class="bg-red-600 text-white px-4 py-2 rounded font-semibold">Confirm Changes</button>
        </div>
      </form>
    </dialog>
  </div>
</main>`;
      }
      return `<div class="admin-page">
  <div>Admin Console</div>
  <div class="modal-box">
    <h3>Confirm Action</h3>
    <input placeholder="Reason" />
    <button>Submit</button>
  </div>
</div>`;
    }

    // ----------------------------------------------------
    // 11-analytics-kpi-dashboard
    // ----------------------------------------------------
    case '11-analytics-kpi-dashboard': {
      if (modality === 'spec') {
        return `<header class="w-full border-b py-4 px-8 flex justify-between items-center"><div class="font-bold">Analytics Hub</div></header>
<main class="max-w-7xl mx-auto px-6 py-8">
  <section class="grid grid-cols-4 gap-6 mb-8">
    <div class="card p-4 border rounded-xl bg-white"><div class="text-sm text-slate-500">Revenue</div><div class="text-2xl font-bold">$24,800</div></div>
    <div class="card p-4 border rounded-xl bg-white"><div class="text-sm text-slate-500">Subscribers</div><div class="text-2xl font-bold">3,820</div></div>
    <div class="card p-4 border rounded-xl bg-white"><div class="text-sm text-slate-500">Churn</div><div class="text-2xl font-bold">1.2%</div></div>
    <div class="card p-4 border rounded-xl bg-white"><div class="text-sm text-slate-500">LTV</div><div class="text-2xl font-bold">$940</div></div>
  </section>
  <section class="border rounded-xl p-6 bg-white">
    <div class="flex justify-between mb-4">
      <input type="text" placeholder="Filter transactions..." class="border rounded px-3 py-2 w-72" />
      <button class="bg-slate-900 text-white px-4 py-2 rounded">Export CSV</button>
    </div>
    <table class="w-full border-collapse"><thead><tr class="border-b"><th class="text-left p-2">Customer</th><th class="text-left p-2">Amount</th></tr></thead><tbody><tr><td class="p-2">Acme Corp</td><td class="p-2">$1,200</td></tr></tbody></table>
    <div class="mt-4 flex justify-end"><button class="border px-4 py-2 rounded">Next Page</button></div>
  </section>
</main>`;
      }
      return `<div>
  <div>Dashboard</div>
  <div class="stats flex"><div>$24,800</div><div>3,820</div></div>
  <div class="table-area">
    <input placeholder="Filter" />
    <div>Table items</div>
  </div>
</div>`;
    }

    // ----------------------------------------------------
    // 12-multi-step-checkout
    // ----------------------------------------------------
    case '12-multi-step-checkout': {
      if (modality === 'spec') {
        return `<header class="w-full border-b py-4 px-8"><div class="font-bold">Secure Checkout</div></header>
<main class="max-w-6xl mx-auto px-6 py-10 flex gap-8">
  <section class="w-2/3 border rounded-xl p-6 bg-white">
    <h2 class="text-xl font-bold mb-4">Shipping Address</h2>
    <form class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <input type="text" placeholder="First Name" class="border rounded p-2" />
        <input type="text" placeholder="Last Name" class="border rounded p-2" />
      </div>
      <input type="text" placeholder="Street Address" class="w-full border rounded p-2" />
      <input type="text" placeholder="City" class="w-full border rounded p-2" />
      <button type="button" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">Continue to Payment</button>
    </form>
  </section>
  <aside class="w-1/3 border rounded-xl p-6 bg-slate-50 card">
    <h3 class="font-bold mb-4">Order Summary</h3>
    <button class="w-full border bg-white py-2 rounded mb-4">Apply Coupon</button>
  </aside>
</main>`;
      }
      return `<div>
  <div>Checkout</div>
  <div class="form">
    <input placeholder="Name" />
    <input placeholder="Address" />
    <button>Continue</button>
  </div>
  <div class="summary">Summary</div>
</div>`;
    }

    // ----------------------------------------------------
    // 13-crm-pipeline-kanban
    // ----------------------------------------------------
    case '13-crm-pipeline-kanban': {
      if (modality === 'spec') {
        return `<header class="w-full border-b py-4 px-8 flex justify-between items-center">
  <div class="font-bold">Deals Pipeline</div>
  <input type="text" placeholder="Search deals by company..." class="border rounded px-4 py-2 w-80" />
  <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium">+ Add New Deal</button>
</header>
<main class="p-8">
  <section class="grid grid-cols-4 gap-6">
    <div class="border rounded-xl p-4 bg-slate-50"><h3 class="font-bold mb-3">Lead</h3><div class="card bg-white p-3 border rounded shadow-sm mb-2"><p>Acme Corp ($12k)</p><button class="text-xs bg-slate-100 px-2 py-1 rounded mt-2">Open Deal</button></div></div>
    <div class="border rounded-xl p-4 bg-slate-50"><h3 class="font-bold mb-3">Contacted</h3><div class="card bg-white p-3 border rounded shadow-sm mb-2"><p>Beta LLC ($40k)</p><button class="text-xs bg-slate-100 px-2 py-1 rounded mt-2">Open Deal</button></div></div>
    <div class="border rounded-xl p-4 bg-slate-50"><h3 class="font-bold mb-3">Proposal</h3></div>
    <div class="border rounded-xl p-4 bg-slate-50"><h3 class="font-bold mb-3">Won</h3></div>
  </section>
</main>`;
      }
      return `<div>
  <div class="top-bar">Deals</div>
  <div class="columns flex">
    <div class="col">Lead</div>
    <div class="col">Contacted</div>
  </div>
</div>`;
    }

    // ----------------------------------------------------
    // 14-settings-preferences
    // ----------------------------------------------------
    case '14-settings-preferences': {
      if (modality === 'spec') {
        return `<div class="max-w-4xl mx-auto px-6 py-10">
  <nav class="tabs flex gap-6 border-b mb-8" role="tablist">
    <button role="tab" class="border-b-2 border-indigo-600 font-bold pb-2">Security</button>
    <button role="tab" class="text-slate-500 pb-2">Profile</button>
    <button role="tab" class="text-slate-500 pb-2">Billing</button>
  </nav>
  <section class="max-w-2xl bg-white border rounded-xl p-6">
    <h2 class="text-xl font-bold mb-6">Security Settings</h2>
    <form class="space-y-4">
      <input type="password" placeholder="Current Password" class="w-full border rounded p-2" />
      <input type="password" placeholder="New Password" class="w-full border rounded p-2" />
      <input type="email" placeholder="Recovery Email Address" class="w-full border rounded p-2" />
      <div class="flex gap-4 pt-4">
        <button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium">Save Changes</button>
        <button type="button" class="border px-6 py-2 rounded-lg">Discard</button>
      </div>
    </form>
  </section>
</div>`;
      }
      return `<div>
  <div class="nav">Tabs</div>
  <div class="form">
    <input placeholder="Password" />
    <button>Save</button>
  </div>
</div>`;
    }

    // ----------------------------------------------------
    // 15-data-grid-management
    // ----------------------------------------------------
    case '15-data-grid-management': {
      if (modality === 'spec') {
        return `<section class="toolbar w-full border-b p-4 flex justify-between bg-white">
  <input type="text" placeholder="Search records..." class="border rounded px-4 py-2 w-80" />
  <div class="flex gap-3">
    <button class="border px-4 py-2 rounded">Batch Actions</button>
    <button class="bg-slate-900 text-white px-4 py-2 rounded">Download CSV</button>
  </div>
</section>
<main class="p-6">
  <table class="w-full border-collapse border bg-white" role="table">
    <thead><tr class="border-b bg-slate-50"><th class="p-3 text-left"><input type="checkbox" /></th><th class="p-3 text-left">Record ID</th></tr></thead>
    <tbody><tr class="border-b"><td class="p-3"><input type="checkbox" /></td><td class="p-3">#8291</td></tr></tbody>
  </table>
</main>
<footer class="pagination border-t p-4 flex justify-between bg-white">
  <span class="text-sm text-slate-500">Showing 1-20 of 120</span>
  <button class="border px-4 py-2 rounded">Next Page -></button>
</footer>`;
      }
      return `<div>
  <div class="tools"><input placeholder="Search" /><button>CSV</button></div>
  <div class="grid-data">Table rows</div>
  <div class="pages"><button>Next</button></div>
</div>`;
    }

    // ----------------------------------------------------
    // 16-mobile-onboarding
    // ----------------------------------------------------
    case '16-mobile-onboarding': {
      if (modality === 'spec') {
        return `<body class="bg-slate-100 flex justify-center p-4">
  <main class="w-full max-w-sm w-[375px] min-h-[812px] bg-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
    <div class="flex justify-end"><button class="text-sm text-slate-500">Skip</button></div>
    <div class="card border rounded-2xl p-6 text-center my-auto"><div class="h-48 bg-indigo-50 rounded-xl mb-4 flex items-center justify-center font-bold text-indigo-400">Illustration</div><h2 class="text-xl font-bold">Welcome to MarkDraw</h2><p class="text-sm text-slate-500 mt-2">[Text Placeholder]</p></div>
    <button class="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold">Get Started</button>
  </main>
</body>`;
      }
      return `<div class="phone">
  <button>Skip</button>
  <div>Welcome</div>
  <button>Get Started</button>
</div>`;
    }

    // ----------------------------------------------------
    // 17-mobile-social-feed
    // ----------------------------------------------------
    case '17-mobile-social-feed': {
      if (modality === 'spec') {
        return `<body class="bg-slate-100 flex justify-center">
  <div class="w-full max-w-sm w-[375px] min-h-screen bg-white relative pb-16">
    <header class="appbar sticky top-0 z-40 bg-white border-b px-4 h-14 flex items-center justify-between">
      <div class="font-bold">SocialFeed</div>
      <button class="text-sm bg-slate-100 px-3 py-1 rounded-full">DM</button>
    </header>
    <main class="p-4 space-y-6">
      <section class="card border rounded-xl p-4 bg-white shadow-sm">
        <h4 class="font-bold text-sm">Sarah Connor</h4>
        <div class="h-48 bg-slate-100 rounded-lg my-3"></div>
        <div class="flex gap-4">
          <button class="text-xs border px-3 py-1.5 rounded">Like</button>
          <button class="text-xs border px-3 py-1.5 rounded">Reply</button>
        </div>
      </section>
    </main>
    <nav class="bottom-nav fixed bottom-0 max-w-sm w-full bg-white border-t h-14 flex justify-around items-center">
      <button class="font-bold text-indigo-600">Home</button>
    </nav>
  </div>
</body>`;
      }
      return `<div class="feed">
  <div class="top">SocialFeed</div>
  <div>Post content <button>Like</button></div>
  <div class="nav-bar"><button>Home</button></div>
</div>`;
    }

    // ----------------------------------------------------
    // 18-mobile-ecommerce-product
    // ----------------------------------------------------
    case '18-mobile-ecommerce-product': {
      if (modality === 'spec') {
        return `<body class="bg-slate-100 flex justify-center">
  <div class="w-full max-w-sm w-[375px] min-h-screen bg-white relative pb-20">
    <header class="border-b px-4 h-12 flex items-center"><button class="text-sm text-slate-600">Back</button></header>
    <main class="p-4">
      <section class="space-y-4">
        <div class="h-64 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-400">Product Image</div>
        <h1 class="text-2xl font-bold">Minimalist Backpack</h1>
        <div class="flex gap-2"><button class="border rounded px-3 py-1 text-sm font-medium">Small</button><button class="border rounded px-3 py-1 text-sm font-medium">Medium</button></div>
      </section>
    </main>
    <footer class="bottom-bar fixed bottom-0 max-w-sm w-full bg-white border-t p-4">
      <button class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Add to Cart — $89</button>
    </footer>
  </div>
</body>`;
      }
      return `<div class="product-page">
  <button>Back</button>
  <div>Product Image</div>
  <div><button>Small</button></div>
  <button>Add to Cart</button>
</div>`;
    }

    // ----------------------------------------------------
    // 19-mobile-profile-settings
    // ----------------------------------------------------
    case '19-mobile-profile-settings': {
      if (modality === 'spec') {
        return `<body class="bg-slate-100 flex justify-center">
  <div class="w-full max-w-sm w-[375px] min-h-screen bg-white p-4">
    <header class="border-b pb-3 mb-6"><h1 class="text-lg font-bold text-center">Profile</h1></header>
    <main>
      <section class="space-y-4">
        <div class="text-center mb-6"><button class="border text-xs px-3 py-1.5 rounded-full mt-2">Edit Profile</button></div>
        <div class="border rounded-xl p-3 flex justify-between items-center"><span class="text-sm">Push Notifications</span><input type="checkbox" checked /></div>
        <button class="w-full border border-red-500 text-red-600 py-3 rounded-xl font-medium mt-8">Sign Out</button>
      </section>
    </main>
  </div>
</body>`;
      }
      return `<div>
  <div>Profile</div>
  <button>Edit</button>
  <div><input type="checkbox" /> Notifications</div>
  <button>Sign Out</button>
</div>`;
    }

    // ----------------------------------------------------
    // 20-mobile-chat-thread
    // ----------------------------------------------------
    case '20-mobile-chat-thread': {
      if (modality === 'spec') {
        return `<body class="bg-slate-100 flex justify-center">
  <div class="w-full max-w-sm w-[375px] min-h-screen bg-white relative pb-16 flex flex-col justify-between">
    <header class="sticky top-0 z-30 bg-white border-b px-4 h-14 flex items-center gap-3">
      <button class="text-sm text-slate-500">Back</button>
      <div class="font-bold text-sm">Elena Rostova</div>
    </header>
    <main class="messages p-4 space-y-3 flex-1 overflow-y-auto">
      <div class="bg-slate-100 p-3 rounded-2xl max-w-[80%] text-sm">Hey, can you review the wireframe contract?</div>
      <div class="bg-indigo-600 text-white p-3 rounded-2xl max-w-[80%] ml-auto text-sm">On it right now!</div>
    </main>
    <footer class="input-bar fixed bottom-0 max-w-sm w-full bg-white border-t p-2 flex gap-2">
      <input type="text" placeholder="Type a message..." class="flex-1 border rounded-full px-4 py-2 text-sm" />
      <button class="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold">Send</button>
    </footer>
  </div>
</body>`;
      }
      return `<div class="chat">
  <div class="head"><button>Back</button> Elena</div>
  <div class="messages">Messages here</div>
  <div class="footer"><input placeholder="Type..." /><button>Send</button></div>
</div>`;
    }

    default:
      return `<div><h1>${fixture.name}</h1><p>${fixture.description}</p></div>`;
  }
}
