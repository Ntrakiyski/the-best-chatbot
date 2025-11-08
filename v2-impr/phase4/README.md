# Phase 4: Project-Assigned Chats and History Views (Reusing Archive Feature)

## High-Level Overview
This phase leverages the existing Archive feature (which groups chats and provides a list view for navigation) to implement project-assigned chat history. Instead of building new logic, extend archives to auto-link with projects: Create a new archive automatically when a project is created. On @project mentions in chats, auto-add the chat to the project's archive. Reuse the archive UI for displaying linked chats in the projects page (e.g., list as cards with title/date, clickable to view). For layout: On desktop, update the project detail page to a two-column layout (70% width for description/versions container, 30% for integrated archive view). On mobile, stack sections vertically (description/versions on top, then archive below). No new core DB tables needed—add foreign keys/links between projects and archives. Follow TDD: Test integrations only. Ensure seamless reuse of archive code for 95% efficiency.

## Overall Task
Extend the existing archive system: On project creation (via `src/app/api/project/actions.ts`), auto-create a linked archive (store archiveId in project schema). In chat processing (`src/app/api/chat/actions.ts`), detect @project mention and add the chat to its archive (reuse assignment logic from archives). On the projects page (`src/components/project/projects-list-page.tsx` and detail page), integrate/reuse archive list UI (query linked archive's chats via `src/lib/db/pg/repositories/archive-repository.pg.ts`). Update project detail layout to two columns on desktop (70/30: left for description/versions, right for archive/chat history); vertical stack on mobile. Add SWR hooks if needed for archive fetches in project context. Tests: Extend existing archive tests (e.g., `tests/archive/archive-crud.spec.ts`) for project linking; new Playwright for UI/layout. Reference archive code (e.g., `src/app/(chat)/archive/[id]/`, `src/components/archive/` if exists) and project patterns from prior phases.

## User Stories

### User Story 1: Auto-Create Archive on Project Creation
As a user, when I create a new project, I want an associated archive created automatically so that future chats can be grouped without manual setup.

- **Subtasks**:
  1. In `src/app/api/project/actions.ts` (project creation action), after saving the project, invoke archive creation (reuse logic from existing archive create endpoint; add `archiveId: string` foreign key to `src/lib/db/pg/schema.pg.ts` for projects table if not present).
  2. In `src/lib/db/pg/repositories/archive-repository.pg.ts` (or create if missing), extend to create archive with project link (e.g., new method `createProjectArchive(projectId: string)` using Drizzle insert).
  3. Update `src/lib/db/pg/repositories/project-repository.pg.ts` to include `archiveId` in project fetches (add to schema first).
  4. Generate and run Drizzle migration via `scripts/db-migrate.ts` to add the foreign key (ensure nullable for backward compatibility).
  5. In `src/types/project.ts`, extend interface with `archiveId?: string` (link to archive type if defined).

- **Acceptance Criteria**:
  - Every new project has a linked archive created and assigned (ID stored in DB).
  - Existing projects without archives remain functional (no breaking changes).
  - Playwright test: Create project; verify archive exists and links to projectId in DB query.
  - Vitest unit test: Mock archive creation; ensure project save includes archiveId.
  - No manual archive creation needed—seamless on project setup.

### User Story 2: Auto-Add Chats to Project Archive on @Mention
As a user, when I @mention a project in a chat, I want it auto-added to the project's archive so that the conversation is grouped and accessible.

- **Subtasks**:
  1. In `src/app/api/chat/actions.ts`, enhance @project detection (build on existing mention logic; fetch project via `project-repository.pg.ts` to get `archiveId`).
  2. If archiveId found, add chat to archive (reuse `archive-repository.pg.ts` methods like addChatToArchive(chatId: string, archiveId: string); update chat schema if needed for linking).
  3. Ensure auto-assignment only for first/subsequent mentions (check if already linked to avoid duplicates; use transaction for atomicity).
  4. Log assignments in `src/lib/logger.ts` (e.g., "Chat assigned to project archive").
  5. Extend existing archive tests in `tests/archive/` (e.g., `archive-crud.spec.ts`) to mock @mention and verify addition.

- **Acceptance Criteria**:
  - @project in chat message auto-links chat to project's archive (no duplicates on repeats).
  - Chats without @mention remain unassigned.
  - Playwright test: Send message with @project; verify chat added to archive via DB query and list view.
  - Vitest unit test: Mock detection; ensure addChatToArchive called correctly.
  - Backward compat: Existing non-project chats unaffected.

### User Story 3: Display Archive Chat List in Projects Page
As a user, in the projects page, I want to see the linked archive's chat list (reuse UI) so that I can view all project-related conversations.

- **Subtasks**:
  1. In `src/lib/db/pg/repositories/project-repository.pg.ts`, add query method to fetch linked chats (filter by projectId; reuse archive query logic).
  2. In `src/app/api/project/[id]/chats/route.ts`, create GET endpoint returning chats from the linked archive (use SWR-friendly format; extend existing if present).
  3. In `src/components/project/projects-list-page.tsx`, add 'Chat History' section reusing archive list component (e.g., cards with title/date; clickable to `/chat/[id]`, adapting from `src/app/(chat)/archive/[id]/page.tsx`).
  4. Extend SWR hook in `src/hooks/queries/use-projects.ts` to fetch history (call the new endpoint).
  5. For empty archives, show placeholder like "No chats yet—start by @mentioning this project".

- **Acceptance Criteria**:
  - 'Chat History' section shows cards for linked chats only; click navigates to chat view.
  - List uses reused/copied archive UI (title/date format).
  - Empty state displays if no chats.
  - Playwright test: Create linked chat; verify card appears in projects page and click loads chat.
  - Vitest unit test: Endpoint returns filtered list from archive query.

### User Story 4: Two-Column Layout on Desktop, Vertical on Mobile
As a user, on desktop, I want the project detail page in two columns (70% description/versions, 30% archive/history) so that info and chats are side-by-side; on mobile, stack vertically for usability.

- **Subtasks**:
  1. In `src/components/project/project-detail-page.tsx`, restructure layout to use CSS Grid (e.g., `grid grid-cols-[70%_30%]` for desktop via Tailwind md breakpoint; `flex flex-col` for mobile/sm).
  2. Place existing description/versions container in left column (70%); add reused archive/list section to right column (30%).
  3. Update SWR fetches in the page to load both (from prior phases for description/versions, new endpoint for history).
  4. Ensure responsive: Mobile stacks vertically (description/versions first, then history); test with Tailwind classes (e.g., `md:grid-cols-[70%_30%]`).
  5. Adapt any existing mobile styles from `src/components/ui/` or archive pages.

- **Acceptance Criteria**:
  - Desktop (>md breakpoint): Side-by-side columns (70/30 split); content fits without overflow.
  - Mobile (≤md): Vertical stack (sections one below the other); full-width.
  - Playwright test: Load page on desktop/mobile emulation; verify layout switches and history loads in right column (or bottom).
  - Vitest unit test: Components render correctly in mocked responsive states (e.g., via CSS-in-JS testing if needed).
  - No breaking changes to existing layout; history visible/responsive.

### User Story 5: Reuse Archive UI for Project History Tool in Chat
As a user, in the chat UI, I want a 'Project History' tool (in tools dropdown, below code execution) so that I can quickly access prior project chats.

- **Subtasks**:
  1. In `src/lib/ai/tools/index.ts`, add 'Project History' tool entry (reuse archive query logic via `archive-repository.pg.ts`; place below code execution in dropdown).
  2. Implement as a simple workflow node (extend `src/components/tool-invocation/` patterns; query chats by project's archiveId).
  3. In `src/components/tool-select-dropdown.tsx`, insert tool after code execution (update list order).
  4. On invocation, display summaries/reuse archive card UI (e.g., mini-list of chats from `src/app/(chat)/archive/` patterns).
  5. Update `src/app/api/chat/actions.ts` to pass project/archive context to tool calls via MCP (`src/lib/ai/mcp/mcp-manager.ts`).

- **Acceptance Criteria**:
  - Tool appears in dropdown (below code execution); invoking shows project-specific chat summaries/list.
  - Reuses archive UI for display (cards with title/date).
  - Only shows history for current project (filters by archiveId).
  - Playwright test: Select tool in chat UI; verify summaries load and click navigates to chat.
  - Vitest unit test: Tool query filters by archiveId correctly; no duplicates.

### User Story 6: Ensure RBAC and Testing for Reused Archive Integration
As a developer, I want secure, tested reuse of archives for projects so that linking is safe and functional.

- **Subtasks**:
  1. In `src/lib/auth/permissions.ts`, add/update rules for project-archive links (e.g., owner can view/add chats; extend existing RBAC for shared access).
  2. Update `src/middleware.ts` to validate project ownership before archive access.
  3. Extend existing archive tests (e.g., `tests/archive/archive-crud.spec.ts` or `tests/projects/project-lifecycle.spec.ts`) to cover linking (mock @mention and verify addition/listing).
  4. Add new Playwright E2E: Full journey—create project (auto-archive), @mention in chat (auto-add), view history in projects page (layout check).
  5. Document reuse in `docs/tips-guides/` (e.g., new section "Project-Archive Linking"); ensure i18n for any UI text (add to `messages/en.json`).

- **Acceptance Criteria**:
  - Non-owners cannot access or add to project archives (403 error).
  - Reuse maintains 95% existing code (no new UI components; copy/adapt from archive).
  - Playwright tests: End-to-end flow passes; layout/UI consistent across devices (desktop/mobile).
  - Vitest tests: No regressions; >90% coverage for new integration points (e.g., linking in actions).
  - Full suite (`pnpm test:e2e`) runs without errors; archived chats persist with project context from prior phases.
