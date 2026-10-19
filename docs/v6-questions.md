# MarkDraw v6.0 Questions & Rule Conflicts Log

Per §0.2 Control Rule 1:
> Zero assumptions. Unspecified value/string/behavior → log in `docs/v6-questions.md`, leave `// V6-QUESTION:` comment, continue elsewhere. Never invent, never silently resolve conflicts — a conflict between two rules is ITSELF a question to log.

---

### Question 1: Rule Conflict between §0.2.3 and §1.2 Repro Commits
- **Rule 0.2.3 Statement:** "`npx tsc -b` + `npm test` green before EVERY commit."
- **Rule 1.2 Statement:** "The seven verified defects (each: write the failing repro test FIRST, commit it, then fix, then green — separate commits)"
- **Conflict:** A failing repro test by definition fails `npm test` (or `tsc -b` if missing interface methods). Committing the failing test first violates §0.2.3 if `npm test` must exit 0.
- **Resolution Strategy under Zero Assumptions:**
  1. Add interface types so `tsc -b` compiles without syntax/type errors.
  2. In Vitest, use `it.fails(...)` for the repro test during the "red repro" commit. In Vitest, `it.fails(...)` asserts that the test fails (documenting the exact defect and exiting with code 0 for CI).
  3. In the subsequent "fix" commit, change `it.fails(...)` to `it(...)` along with the fix, asserting that the defect is now resolved and green.
