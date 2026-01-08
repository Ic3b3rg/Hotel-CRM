# HotelCRM Desktop - Claude Code Vibe Coding Case Study

> **An experimental case study exploring AI-assisted development velocity for SMEs using Claude Code in plan mode.**

## Overview

This repository documents **HotelCRM Desktop**, an offline-first CRM for Italian hotel real estate brokerage transactions. Beyond its functional purpose, this project serves as a **case study** to evaluate how Claude Code performs in "vibe coding" scenarios—specifically using **plan mode** to see how much AI-assisted development can accelerate software delivery for small and medium enterprises (PMI).

**Current development time:** ~8 hours (including cross-platform Mac/Windows challenges)

## Why This Project Was Chosen

This project was selected for the case study because it represents a **real-world use case**:

- **Domain complexity**: Hotel brokerage involves buyers, sellers, properties, deals with commission structures, payment tracking, and activity timelines
- **Full-stack requirements**: Desktop app with local database, not a simple web prototype
- **Italian localization**: Domain-specific terminology and formatting (EUR with dot separators, Italian regions)
- **Production constraints**: The system runs on actual user machines—backward compatibility is mandatory

A toy project wouldn't reveal the true capabilities and limitations of an LLM agent. This CRM, destined for real use, provides authentic complexity that exposes where AI excels and where it struggles.

## Why Electron + React?

**Deliberate complexity layer for the AI agent.**

Electron with React was chosen specifically to increase the challenge for an LLM:

| Challenge | Description |
|-----------|-------------|
| **Three-process architecture** | Main, preload, and renderer processes with strict isolation |
| **IPC communication** | 34 typed channels bridging processes through `contextBridge` |
| **Native modules** | `better-sqlite3` requires special handling for cross-platform builds |
| **Type safety across boundaries** | Types defined once but enforced across 3 separate compilation targets |
| **Security constraints** | `contextIsolation: true`, `nodeIntegration: false` |
| **Migration management** | 11 SQL migrations that must be idempotent and backward-compatible |

This architecture tests the agent's ability to maintain consistency across multiple codepaths, handle native dependencies, and manage complex state.

---

## Development Timeline & Methodology

### Session 1: Foundation (Plan Mode)

The first session used Claude Code's **plan mode** to establish the base architecture:
- Electron + React setup with Vite
- SQLite database with repository pattern
- Basic CRUD for buyers, sellers, properties, deals
- shadcn/ui component integration

**Outcome**: Functional MVP, but with significant technical debt. Files grew organically without decomposition, resulting in components exceeding 700 lines.

### Session 2: Feature Implementation (Ralph Technique)

The second session introduced the **Ralph technique** and incorporated **Anthropic's Claude 4.5 best practices** (see Sources).

Key methodological improvements:
- Structured PRD (`prd.json`) with acceptance criteria
- Automated iteration with progress tracking
- Single-feature-per-iteration discipline
- Explicit instructions with context (why, not just what)

---

## Ralph Technique Implementation

**Ralph** is an iterative AI development method created by Geoffrey Huntley. In its purest form:

```bash
while :; do cat PROMPT.md | claude-code ; done
```

### How We Applied Ralph

1. **Started from TODO.md**: Manual list of required features in plain text
2. **LLM refinement**: Used Claude to transform vague requirements into specific, testable steps
3. **Created prd.json**: Structured specification with 16 features, each containing:
   - Category (functional/ui/info)
   - Description with ID (e.g., `[PROP-002] Campo Codice Immobile`)
   - Step-by-step acceptance criteria
   - Pass/fail status

4. **Automated execution**: `ralph.sh` (macOS) and `ralph.ps1` (Windows) scripts that:
   - Read `prd.json` for remaining work
   - Read `progress.txt` for implementation context
   - Instruct Claude to implement ONE feature per iteration
   - Update PRD status and progress log
   - Loop until `<promise>COMPLETE</promise>` marker detected

### Ralph Folder Contents

```
ralph/
├── ralph.sh        # Bash automation script
├── ralph.ps1       # PowerShell automation script
├── prd.json        # 16 feature specifications (all passes: true)
└── progress.txt    # Detailed implementation log with root causes and solutions
```

### Key Insight

**Ralph dramatically reduces development velocity but improves output quality.**

The single-feature-per-iteration constraint prevents the agent from taking shortcuts, forces comprehensive documentation, and maintains architectural consistency. Each feature touches all layers (migration → repository → IPC → hook → component) following the established patterns.

---

## Anthropic Claude 4.5 Best Practices Applied

In the second session, we applied recommendations from Anthropic's official prompt engineering guide for Claude 4.x models:

### Explicit Instructions
```
// Less effective:
"Add a price field"

// More effective:
"Add a prezzo_richiesto field to deals. This field should:
- Be optional (nullable)
- Use EurInput component for Italian formatting
- Be displayed in the deal detail panel with € suffix"
```

### Context for Motivation
Explaining *why* a behavior matters helps Claude generalize correctly:
```
"The system is already in production on user machines.
Backward compatibility is mandatory—migrations must use
ALTER TABLE ADD COLUMN with defaults, never destructive changes."
```

### Structured State Tracking
- `prd.json`: Structured format for requirement tracking
- `progress.txt`: Freeform notes for implementation context
- Git commits as checkpoints

### Long-Horizon Reasoning
Claude 4.5 excels at tasks spanning multiple context windows when given proper scaffolding. The Ralph technique leverages this by maintaining external state files that persist across sessions.

---

## Observed Limitations

During development, several characteristic AI-generated code patterns emerged—what the community sometimes refers to as "AI slop" or "LLM artifacts":

### Pattern Convergence
The agent gravitates toward familiar patterns even when alternatives would be better:
- Repeated CRUD handler boilerplate (~20 nearly identical functions across routes)
- Same component structure copy-pasted instead of abstracted
- Constants duplicated instead of centralized

### Context Drift
As files grow, the agent loses track of earlier decisions:
- Late additions don't follow early patterns
- Naming conventions become inconsistent
- Error handling approaches vary within the same file

### Over-Local Optimization
The agent optimizes for the immediate task rather than system coherence:
- Fixes a bug by adding a `setTimeout` instead of addressing state management
- Uses `JSON.stringify` for deep equality instead of proper comparison
- Creates inline solutions rather than reusable utilities

### Hook Misuse
React semantics are approximated rather than properly understood:
- `useState(() => { sideEffect() })` instead of `useEffect` (critical bug)
- Dependencies arrays that don't capture all reactive values
- State updates that could trigger infinite loops under certain conditions

---

## Degraded Code Audit

### File Size Violations

| File | Lines | Issue |
|------|-------|-------|
| `src/routes/trattative.tsx` | 738 | Monolithic component, business logic mixed with rendering |
| `src/routes/immobili.tsx` | 719 | Multiple filter states, attachment handling, duplicated constants |
| `src/components/property-form.tsx` | 439 | 20+ form fields, conditional rendering, no decomposition |
| `src/components/deal-form.tsx` | 383 | Complex pricing + commission logic inline |

**Threshold exceeded**: Files >500 lines indicate insufficient componentization.

### Critical Bug

**Location**: `src/routes/trattative.tsx:151-153`

```typescript
// WRONG: useState is for state, not side effects
useState(() => {
  refreshSelectedDeal();
});

// SHOULD BE:
useEffect(() => {
  refreshSelectedDeal();
}, [refreshSelectedDeal]);
```

This is a fundamental React misunderstanding—`useState` does not execute callbacks as side effects.

### DRY Violations

**Duplicated Constants**:
- `REGIONI_ITALIANE` defined in both `immobili.tsx` (lines 39-60) and `property-form.tsx` (lines 35-56)
- `OPERATION_TYPES` defined in both files

**Should be**: Single source of truth in `src/lib/constants.ts`

### Anti-Patterns

| Pattern | Location | Issue |
|---------|----------|-------|
| `JSON.stringify` comparison | trattative.tsx:144 | Performance killer, order-sensitive, fragile |
| `setTimeout(..., 100)` | trattative.tsx:97-103 | Magic number, doesn't solve underlying state sync |
| Sequential file uploads | immobili.tsx:157-167 | Should use `Promise.all` for parallel uploads |
| No error feedback | Multiple forms | Upload failures silently ignored |

### Repeated Handler Patterns

All route files contain nearly identical CRUD handlers:

```typescript
const handleEditClick = () => { /* same logic */ };
const handleDeleteClick = () => { /* same logic */ };
const handleCreate = async () => { /* same logic */ };
const handleUpdate = async () => { /* same logic */ };
const handleDelete = async () => { /* same logic */ };
```

**Abstraction opportunity**: Custom `useCRUDHandlers<T>` hook could eliminate ~200 lines of duplication.

---

## Software Quality Audit

### Scoring Methodology

Each principle scored 1-5:
- **5**: Exemplary implementation
- **4**: Good with minor issues
- **3**: Acceptable but needs improvement
- **2**: Significant problems
- **1**: Critical failure

### Results

| Principle | Score | Notes |
|-----------|-------|-------|
| **Single Responsibility** | 2/5 | Route components handle UI, state, filtering, CRUD, side effects |
| **Don't Repeat Yourself** | 2/5 | Constants duplicated, handlers duplicated, form patterns repeated |
| **Separation of Concerns** | 3/5 | Good IPC/repository split, but UI components mix too many concerns |
| **Type Safety** | 4/5 | Strong typing across layers, minor gaps in optional chaining |
| **Error Handling** | 2/5 | Inconsistent—some operations silently fail, others properly report |
| **Performance** | 3/5 | JSON.stringify comparisons, sequential uploads, unnecessary re-renders |
| **Security** | 4/5 | Proper context isolation, no injection vulnerabilities found |
| **Testability** | 2/5 | No tests, tightly coupled components difficult to unit test |
| **Documentation** | 4/5 | CLAUDE.md comprehensive, progress.txt detailed, inline comments sparse |
| **Maintainability** | 2/5 | Large files, duplicated logic, implicit patterns |

**Overall Score: 28/50 (56%)**

### Interpretation

The codebase is **functional but carries significant technical debt**. It works for its intended purpose but would be costly to maintain or extend. This is characteristic of rapid AI-assisted development without sufficient refactoring passes.

---

## Conclusions & Future Work

### What Works Well

1. **Initial scaffolding**: Claude excels at setting up project structure, configurations, and boilerplate
2. **Full-stack consistency**: When given explicit patterns, the agent maintains them across layers
3. **Domain translation**: Italian terminology and business logic correctly implemented
4. **Ralph technique**: Single-feature iterations produce better results than bulk implementations
5. **Plan mode**: Forces exploration before implementation, reduces wasted effort

### What Needs Improvement

1. **Abstraction recognition**: Agent doesn't proactively extract shared logic
2. **React semantics**: Hook rules are approximated, not deeply understood
3. **Performance awareness**: Naive implementations that work but don't scale
4. **Refactoring discipline**: Code grows but isn't regularly cleaned up
5. **Context limits**: Quality degrades as files exceed ~500 lines

### Study Continuation

This study will continue by:

1. **Expanding the project incrementally**, following a simulated client's evolving requirements
2. **Tracking the context threshold**: At what point does the agent lose coherent understanding of the codebase?
3. **Integrating CI/CD**: Adding Claude Code to GitHub Actions to measure automated PR quality
4. **Comparing approaches**: Plan mode vs. direct implementation, Ralph vs. ad-hoc prompting
5. **Testing recovery**: How well can the agent identify and fix its own degraded code?

The goal is to find the **practical boundary** of AI-assisted development—where human review becomes essential, and what workflows maximize the AI's contribution while minimizing technical debt.

---

## Quick Start

### Requirements
- Node.js 20+
- npm 10+

### Development

```bash
npm install
npm run dev:electron    # Full Electron app with hot-reload
```

### Build

```bash
npm run build:mac       # macOS (DMG + ZIP)
npm run build:win       # Windows (NSIS + portable)
```

### Database Location

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/hotel-crm-desktop/hotel-crm.db` |
| Windows | `%APPDATA%/hotel-crm-desktop/hotel-crm.db` |
| Linux | `~/.config/hotel-crm-desktop/hotel-crm.db` |

---

## Tech Stack

- **Electron 33** - Desktop framework
- **React 19** - UI framework
- **Vite 6** - Build tool
- **better-sqlite3** - Synchronous SQLite
- **Tailwind CSS 4** - Styling
- **shadcn/ui + Radix UI** - Component library
- **React Router 7** - Routing
- **Zod + React Hook Form** - Validation

---

## Sources

1. **Ralph Technique**: Huntley, G. (2024). "Ralph." https://ghuntley.com/ralph/

2. **Claude 4.5 Best Practices**: Anthropic. (2025). "Prompting best practices for Claude 4.x models." https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices

3. **Claude Code**: Anthropic. (2025). "Claude Code - Agentic coding tool." https://claude.ai/claude-code

4. **shadcn/ui**: Sharma, S. (2024). "shadcn/ui - Beautifully designed components." https://ui.shadcn.com/

5. **Electron Security**: Electron Team. (2024). "Security Best Practices." https://www.electronjs.org/docs/latest/tutorial/security

---

## License

This case study and codebase are provided for educational and research purposes.

---

*Generated with Claude Code (Claude Opus 4.5) using plan mode and Ralph technique.*
