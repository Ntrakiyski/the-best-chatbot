# Phase 2: ✨ Button and Project Versions

## High-Level Overview
This phase adds a ✨ button for Grok 4-based XML prompt generation and a versioning system for projects (with active/inactive toggles; auto-prefix 'V'). The button transforms system prompt text into concise XML. Versioning ensures only one active version per project, updating context in chats via MCP. Build on Phase 1 schema (add `xmlSystemPrompt` and `versions` array). Use existing prompt engine for generation.

## Overall Task
Extend schema for `xmlSystemPrompt: string` and `versions: {title: string, active: boolean}[]`. Create server action for Grok 4 call (via OpenRouter). Add UI button in project edit (top-right of prompt container) and version list with toggles. Enforce one-active via DB. Integrate with MCP/prompts for injection. Tests: Vitest for generation/toggle logic; Playwright for UI. Reference `src/lib/ai/prompts.ts` and `src/app/api/project/actions.ts`.

## User Stories

### User Story 1: Add ✨ Button for XML Prompt Generation
As a user, I want a ✨ button in the system prompt editor so that I can auto-generate a concise XML version using Grok 4 for better project backbone info.

- **Subtasks**:
  1. In `src/lib/db/pg/schema.pg.ts`, add `xmlSystemPrompt?: string` field to projects table.
  2. In `src/app/api/project/[id]/generate-prompt/route.ts`, create new POST action calling OpenRouter Grok 4 (input: current prompt text; output: XML via `src/lib/ai/prompts.ts` formatting; Zod input/output validation).
  3. In `src/components/project/project-detail-page.tsx`, position ✨ button at top-right of prompt container (use CSS positioning from `src/components/ui/````
  4. On click, call the action via SWR mutation (extend `src/hooks/queries/use-projects.ts`).
  5. Auto-save generated XML to DB on success.

- **Acceptance Criteria**:
  - Button appears at exact position; clicking triggers Grok 4 API without errors.
  - Generated XML is concise, valid, and saved to project (viewable in edit UI).
  - Playwright test: Click button, verify XML in prompt field and DB.
  - Vitest unit test: Mock OpenRouter response; ensure formatting in `prompts.ts`.
  - Error handling: Invalid input shows toast via `src/lib/notify.tsx`.

### User Story 2: Create Project Versions in UI
As a user, I want to create new versions (titled e.g., "App Structure" → "V1. App Structure") so that I can version-control project configs without losing history.

- **Subtasks**:
  1. In `src/types/project.ts`, extend with `versions?: {title: string, active: boolean}[]`.
  2. In `src/lib/db/pg/schema.pg.ts`, update schema to include versions array (JSONB or array column).
  3. In `src/app/api/project/[id]/versions/route.ts`, add POST for creating new version (auto-prefix 'V' in title; default active false).
  4. In `src/components/project/project-detail-page.tsx`, add "Add Version" button and list (reuse modal from creation).
  5. Generate Drizzle migration in `scripts/db-migrate.ts` for schema change.

- **Acceptance Criteria**:
  - New versions save with 'V' prefix (e.g., "V1. App Structure").
  - List shows all versions; old ones persist.
  - Playwright test: Create version; verify array in DB via query.
  - Vitest unit test: Prefix logic works; array validation with Zod.

### User Story 3: Toggle Active/Inactive Versions
As a user, I want to toggle versions active/inactive so that only one is the default for chats, switching others off automatically.

- **Subtasks**:
  1. In `src/app/api/project/[id]/versions/route.ts`, add PUT for toggling (set target active=true, others false; atomic DB update via Drizzle transaction in `src/lib/db/pg/repositories/project-repository.pg.ts`).
  2. In `src/components/project/project-detail-page.tsx`, add toggle buttons per version (use React state to enforce one-active on client).
  3. On toggle, call server action and refetch via SWR (`src/hooks/queries/use-projects.ts`).
  4. Update RBAC in `src/lib/auth/permissions.ts` to allow toggle only for owners.
  5. Add Vitest test in `tests/projects/project-crud.spec.ts` for toggle logic.

- **Acceptance Criteria**:
  - Toggling one version deactivates others; only one active at a time.
  - UI updates immediately; DB reflects change.
  - Playwright test: Toggle version; verify active flags in DB (no multiples active).
  - Vitest unit test: Transaction ensures atomicity; error if invalid toggle.

### User Story 4: Inject Active Version Context in Chats
As a user, when @project is mentioned, I want the active version's prompt/repo injected via MCP so that chats reflect the current project state.

- **Subtasks**:
  1. In `src/lib/ai/prompts.ts`, extend assembly to select active version and include its prompt/repo in XML (build on Phase 1 injection).
  2. In `src/app/api/chat/actions.ts`, update @project detection to fetch active version from repo (`src/lib/db/pg/repositories/project-repository.pg.ts`).
  3. In `src/lib/ai/mcp/mcp-manager.ts`, ensure active version context passes to agents/workflows.
  4. Log version injections in `src/lib/logger.ts` for debugging.
  5. Extend Playwright test from Phase 1 for version-specific context.

- **Acceptance Criteria**:
  - Chat with @project uses active version's XML; switching versions updates future responses.
  - No injection if no active version (fallback to base project).
  - Playwright test: Switch version, @mention project; verify updated XML in response.
  - Vitest unit test: Mock fetch; ensure correct version selected.

### User Story 5: UI Feedback for Version Management
As a developer, I want toast notifications and error handling for version operations so that users know the status.

- **Subtasks**:
  1. In `src/lib/notify.tsx`, add toasts for version create/toggle success/error (extend existing patterns).
  2. In server actions (`src/app/api/project/[id]/versions/route.ts`), return structured errors for Zod/RBAC failures.
  3. In `src/components/project/project-detail-page.tsx`, hook toasts to action responses.
  4. Ensure i18n support: Add strings to `messages/en.json` and propagate.
  5. Test in Vitest: Mock errors; verify toast displays correctly.

- **Acceptance Criteria**:
  - Success: Toast shows "Version activated" on toggle.
  - Error: Toast shows "Only one active version allowed" on invalid toggle.
  - Playwright test: Trigger error (e.g., network fail); verify toast and no DB change.
  - Vitest unit test: Action returns error; UI handles without crash.

### User Story 6: Testable XML Generation (Bonus)
As a developer, I want full coverage for Grok 4 integration so that prompt transformation is reliable.

- **Subtasks**:
  1. In `src/app/api/project/[id]/generate-prompt/route.ts`, add unit tests mocking OpenRouter.
  2. Extend E2E in `tests/projects/project-lifecycle.spec.ts` for button + generation flow.
  3. In `src/lib/ai/prompts.ts`, test XML output formatting with Vitest.
  4. Document in `docs/tips-guides/system-prompts-and-customization.md`.
  5. Ensure >90% coverage; run full suite.

- **Acceptance Criteria**:
  - Mocked Grok response produces valid XML; no injection vulnerabilities.
  - E2E: Button click generates and saves XML; chat uses it.
  - Vitest: Edge cases (empty input) return safe defaults.
