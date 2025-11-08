# Phase 4: Project-Assigned Chats and History Views

## High-Level Overview
This final phase auto-assigns chats to projects on @mention, adds a 'Chat History' UI in projects page (cards with title/date; clickable), and a 'Project History' MCP tool in chat dropdown (below code execution). Builds on prior phases for linking/context. Use SWR for UI lists, repository for queries.

## Overall Task
Update chat schema to include `projectId` (foreign key). In chat actions, auto-link on @project. Add UI tab in `src/components/project/projects-list-page.tsx` for history (query via repo). Create 'Project History' as MCP tool (`src/lib/ai/tools/index.ts`). Tests: Vitest for linking; Playwright for UI/navigation. Reference `src/app/api/chat/actions.ts` and SWR patterns.

## User Stories

### User Story 1: Auto-Assign Chats to Projects on @Mention
As a user, when I @mention a project in a chat, I want it auto-assigned so that the conversation is linked and gets project context.

- **Subtasks**:
  1. In `src/lib/db/pg/schema.pg.ts`, add `projectId` foreign key to chats table (nullable for non-linked).
  2. In `src/app/api/chat/actions.ts`, detect @project and set `projectId` on new chats (use existing @mention logic).
  3. Update `src/lib/db/pg/repositories/chat-repository.pg.ts` with method to link/update (transactional).
  4. Ensure context injection from Phases 1-3 (repo/tech stack + version/docs) applies.
  5. Add logging in `src/lib/logger.ts` for assignment events.

- **Acceptance Criteria**:
  - @project in message creates/updates chat with projectId; context injects.
  - Non-linked chats remain independent.
  - Playwright test: Start chat, @mention; verify projectId in DB and context in response.
  - Vitest unit test: Detection sets ID correctly.

### User Story 2: View Chat History in Projects Page
As a user, in the projects page, I want a 'Chat History' section listing chats as cards (title + date) so that I can click to view full conversations.

- **Subtasks**:
  1. In `src/lib/db/pg/repositories/project-repository.pg.ts`, add query method to fetch linked chats (filter by projectId).
  2. In `src/app/api/project/[id]/chats/route.ts`, create GET endpoint returning chats (use SWR-friendly format).
  3. In `src/components/project/projects-list-page.tsx`, add 'Chat History' tab/section with cards (title/date; clickable to `/chat/[id]` via router).
  4. Extend SWR hook in `src/hooks/queries/use-projects.ts` to fetch history.
  5. Style cards using `src/components/ui/card.tsx` pattern.

- **Acceptance Criteria**:
  - Tab shows cards for linked chats only; click navigates to chat view.
  - Empty history shows "No chats yet".
  - Playwright test: Create linked chat; verify card appears and click loads chat.
  - Vitest unit test: Endpoint returns filtered list.

### User Story 3: Add Project History Tool in Chat Dropdown
As a user, in the chat UI, I want a 'Project History' tool (in tools dropdown, below code execution) so that I can quickly access prior project chats.

- **Subtasks**:
  1. In `src/lib/ai/tools/index.ts`, add 'Project History' tool (workflow node querying chats by projectId; display summaries via `src/lib/ai/tools/visualization/`).
  2. Position below code execution in dropdown (extend `src/components/tool-select-dropdown.tsx`).
  3. In MCP (`src/lib/ai/mcp/mcp-manager.ts`), register tool for agent access.
  4. In `src/app/api/chat/tools/route.ts` (or existing), handle tool call to fetch/display history.
  5. Add Vitest test mocking query for tool output.

- **Acceptance Criteria**:
  - Tool appears in dropdown; invoking shows chat summaries in chat.
  - Only shows history for current project.
  - Playwright test: Select tool in chat; verify summaries load.
  - Vitest unit test: Tool query returns linked chats.

### User Story 4: Navigate from History Cards to Chat Views
As a user, when I click a chat history card, I want to be redirected to that chat so that I can continue or review the conversation.

- **Subtasks**:
  1. In `src/components/project/projects-list-page.tsx`, add onClick handler routing to `/chat/[id]` (use Next.js router).
  2. Ensure SWR in chat view (`src/app/(chat)/chat/[thread]/page.tsx`) loads with project context.
  3. Update `src/hooks/queries/use-projects.ts` to pass chatId for navigation.
  4. Handle no-access (RBAC via `src/lib/auth/permissions.ts`).
  5. Test navigation in Playwright (full flow from projects to chat).

- **Acceptance Criteria**:
  - Click card loads full chat history with context.
  - Unauthorized access redirects/errors.
  - Playwright test: Click card; verify URL and loaded content.
  - Vitest unit test: Router params include project context.

### User Story 5: Secure Linking and RBAC for History
As a developer, I want RBAC enforcement on chat assignments/history so that users only see their project's data.

- **Subtasks**:
  1. In `src/lib/auth/permissions.ts`, add rules for chat-project linking (owner or shared access).
  2. In `src/app/api/project/[id]/chats/route.ts`, validate project ownership before returning history.
  3. Update `src/middleware.ts` to check linking permissions.
  4. In UI, hide/show history based on session (via SWR error handling).
  5. Extend tests in `tests/permissions/resource-permissions.spec.ts`.

- **Acceptance Criteria**:
  - Non-owners cannot access others' history (403).
  - Shared projects allow view (if permitted).
  - Playwright test: Unauthorized user sees empty list/error.
  - Vitest unit test: Permissions block invalid queries.

### User Story 6: Full E2E Testing for History Flows (Bonus)
As a developer, I want complete tests for assignment and history so that the feature is robust.

- **Subtasks**:
  1. In `tests/projects/project-lifecycle.spec.ts`, add E2E for @mention assignment.
  2. Extend `tests/core/unauthenticated.spec.ts` for history UI.
  3. Mock tool calls in Vitest for MCP integration.
  4. Document in `docs/tips-guides/` (history management section).
  5. Run suite; ensure no regressions from prior phases.

- **Acceptance Criteria**:
  - Tests cover assignment, listing, and tool use.
  - >90% coverage; E2E simulates full user journey.
  - Vitest: Edge cases (empty history) handled.
