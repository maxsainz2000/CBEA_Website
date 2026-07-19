# Task 36: Remove Supabase Project-Ref from GEMINI.md

## Objective
Sanitize the `GEMINI.md` MCP server URL to replace the hardcoded Supabase project_ref `ikoogqwigvfylwjatids` with `<YOUR_PROJECT_REF>`. The project_ref alone is not enough to compromise the project, but combined with the service-role key that was previously leaked in AUDIT-v1, it identifies the exact Supabase project to target. Sanitizing prevents information disclosure while keeping the useful MCP configuration documentation.

## Audit Reference
- **Findings:** X9 (LOW, -0.25 pts)
- **Severity:** LOW (information disclosure — Supabase project_ref committed to repo)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X9, §8.9 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [GEMINI.md](file:///c:/Users/Admin/Documents/CBEA_Website/GEMINI.md)

## Step-by-Step Instructions

### 1. Sanitize the project_ref in GEMINI.md

Find the MCP server URL (approximately line 14) and replace the project_ref:

```markdown
<!-- BEFORE: -->
"serverUrl": "https://mcp.supabase.com/mcp?project_ref=ikoogqwigvfylwjatids&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage"

<!-- AFTER: -->
"serverUrl": "https://mcp.supabase.com/mcp?project_ref=<YOUR_PROJECT_REF>&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage"
```

### 2. Verify the leak is gone

```bash
grep -r 'ikoogqwigvfylwjatids' . --include='*.md' --include='*.json' --include='*.ts' 2>/dev/null \
  | grep -v node_modules | grep -v documentations/ | grep -v tasks/ | grep -v plans/ | grep -v archive/
# Should return no hits (only audit files mention it as evidence)
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Security best practice:** Never commit infrastructure identifiers (project refs, API keys, internal URLs) to public or shared repositories.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# No code changes, just a doc edit. Verify with grep:
grep 'ikoogqwigvfylwjatids' GEMINI.md
# Should return no hits
```

### Manual Verification
- Open `GEMINI.md` and verify the project_ref shows `<YOUR_PROJECT_REF>` instead of the real value.

## Acceptance Criteria
- [x] `GEMINI.md` does NOT contain `ikoogqwigvfylwjatids`.
- [x] `GEMINI.md` shows `<YOUR_PROJECT_REF>` as a placeholder in the MCP server URL.
- [x] `grep 'ikoogqwigvfylwjatids' GEMINI.md` returns no hits.
