# Phase 3: Live Docs for Agents

## High-Level Overview
This phase adds "Live Docs" as a simple URL array to agents, editable in the UI (no names needed). Agents access these in chats via MCP (e.g., fetch/analyze on-demand). This extends agent capabilities without core changes. Use existing MCP tools for URL handling. Build on prior phases for schema/UI patterns.

## Overall Task
Add `liveDocs: string[]` (URLs only) to agent schema. Update creation/edit UI with multi-URL input. Integrate into MCP for chat access (pass to prompts/tools). Validate/save via actions. Tests: Vitest for array handling; Playwright for UI/add in chats. Reference `src/lib/ai/mcp/` and `src/components/agent/edit-agent.tsx`.

## User Stories

### User Story 1: Add Multi-URL Input for Live Docs in Agent Creation
As a user, when creating an agent, I want to add multiple live doc URLs (no names needed) so that the agent can reference them in chats.

- **Subtasks**:
  1. In `src/lib/db/pg/schema.pg.ts`, add `liveDocs?: string[]` field to agents table.
  2. In `src/types/agent.ts`, extend interface with `liveDocs?: string[]`.
  3. In `src/app/api/agent/route.ts`, extend create action to include array (Zod array validation for URLs).
  4. In `src/components/agent/edit-agent.tsx` (or creation modal), add repeatable URL input field (use form array pattern from `src/components/ui/`). 
  5. Generate migration via `scripts/db-migrate.ts`; ensure array persists.

- **Acceptance Criteria**:
  - Creation form allows adding/removing URLs; each is a valid URL (Zod rejects invalids).
  - URLs save as array in DB; existing agents unaffected.
  - Playwright test: Add 2 URLs during creation; verify array in DB.
  - Vitest unit test: Action validates array; no duplicates.

### User Story 2: Edit Live Docs in Agent Edit UI
As a user, when editing an agent, I want to update the list of live doc URLs so that I can refine agent knowledge dynamically.

- **Subtasks**:
  1. In `src/app/api/agent/[id]/route.ts`, add PUT endpoint for updating `liveDocs` array (extend existing; Zod for each URL).
  2. In `src/lib/db/pg/repositories/agent-repository.pg.ts` (create if missing), add update method for array.
  3. In `src/components/agent/edit-agent.tsx`, add edit view for URLs (load current array; support add/remove).
  4. Extend SWR in `src/hooks/queries/use-agents.ts` (new hook if needed) for refetch after edit.
  5. Ensure RBAC via `src/lib/auth/permissions.ts` (owner-only).

- **Acceptance Criteria**:
  - Edit UI shows current URLs; changes save without loss.
  - Invalid URLs show errors; valid ones update DB.
  - Playwright test: Load agent, add/remove URL, submit—verify array.
  - Vitest unit test: Update action handles partial updates.

### User Story 3: Access Live Docs in Agent Chats
As a user, in chats with the agent, I want it to access live docs (e.g., fetch content) so that responses incorporate real-time documentation.

- **Subtasks**:
  1. In `src/app/api/agent/[id]/route.ts`, extend chat handling to pass `liveDocs` array to MCP (via prompt or tool call).
  2. In `src/lib/ai/mcp/mcp-manager.ts`, update manager to inject URLs into agent prompts (e.g., "Fetch from: [urls]").
  3. Leverage HTTP tool node in `src/lib/ai/tools/http/` for on-demand fetching during workflows.
  4. In `src/lib/ai/prompts.ts`, add conditional URL injection if docs mentioned.
  5. Log access in `src/lib/logger.ts` for auditing.

- **Acceptance Criteria**:
  - Mentioning doc-related query in chat triggers fetch from URLs.
  - Agent response references doc content (e.g., summary).
  - Playwright test: Chat with agent; verify URL fetch in logs/response.
  - Vitest unit test: Mock fetch; ensure URLs passed correctly.

### User Story 4: Validate and Secure Live Docs Storage
As a developer, I want URL validation and secure storage for live docs so that only safe links are used.

- **Subtasks**:
  1. In `src/app/api/agent/route.ts`, add Zod schema requiring valid URLs (no schemes like javascript:).
  2. In `src/lib/db/pg/repositories/agent-repository.pg.ts`, sanitize array on save (escape if needed).
  3. Update `src/middleware.ts` for RBAC on doc access.
  4. In UI (`src/components/agent/edit-agent.tsx`), add client-side URL validation before submit.
  5. Extend tests in `tests/agents/agents.spec.ts` for validation.

- **Acceptance Criteria**:
  - Invalid URLs rejected server/client-side with errors.
  - Secure: No execution of malicious URLs (test via Vitest mock).
  - Playwright test: Submit invalid URL; verify rejection/toast via `src/lib/notify.tsx`.
  - Vitest unit test: Sanitization prevents XSS-like issues.

### User Story 5: UI Feedback for Live Docs Management
As a user, I want clear feedback when adding/using live docs so that I know if they're successfully integrated.

- **Subtasks**:
  1. In `src/lib/notify.tsx`, add toasts for doc add/edit success/error.
  2. In `src/components/agent/edit-agent.tsx`, show preview of URLs list on load.
  3. During chat, notify if doc fetch fails (extend chat actions in `src/app/api/agent/`). 
  4. Add i18n strings to `messages/en.json` for doc-related messages.
  5. Test feedback in Playwright (e.g., toast on invalid URL).

- **Acceptance Criteria**:
  - Toast: "URL added to live docs" on success.
  - In-chat: If fetch fails, user sees friendly error.
  - Playwright test: Add URL; verify toast; simulate fail in chat.
  - Vitest unit test: Notification triggers correctly.

### User Story 6: Testable MCP Integration for Docs (Bonus)
As a developer, I want E2E tests ensuring live docs work across phases.

- **Subtasks**:
  1. Extend `tests/agents/agent-creation.spec.ts` for doc addition in creation/edit.
  2. In `tests/agents/agent-visibility.spec.ts`, test chat access (mock HTTP fetch).
  3. Run full Vitest/Playwright suite for integration.
  4. Document in `docs/tips-guides/` (agent docs section).
  5. Ensure >90% coverage; no regressions.

- **Acceptance Criteria**:
  - Tests pass for full flow; docs injected in MCP.
  - E2E: Agent uses docs in chat; fallback if empty.
  - Vitest: Edge cases (empty input) return safe defaults.
