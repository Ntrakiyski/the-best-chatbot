# Phase 1: GitHub Repo Integration and Editable Tech Stack

## High-Level Overview
This phase focuses on enhancing project creation and editing to include GitHub repo selection (via API dropdown) and editable tech stack fields. This enables automatic context injection (e.g., repo details as XML) when @project is mentioned in chats. Integration uses existing auth patterns for secure GitHub API access, with updates to schema, repositories, actions, and UI. Follow TDD: Write tests before code. Ensure backward compatibility for existing projects.

## Overall Task
Update the project schema to support `githubRepoUrl` and editable `techStack` (array of strings). Extend project creation/edit UI with a GitHub repo dropdown (fetch via API using OAuth token). Create server actions for repo fetching and saving. In chat actions, detect @project mentions and inject repo/tech stack as XML context via prompt assembly. Add Vitest unit tests for actions/repo logic and Playwright E2E tests for UI flows. Reference existing files for patterns (e.g., OAuth in `src/lib/auth/oauth-redirect.ts`, prompts in `src/lib/ai/prompts.ts`).

## User Stories

### User Story 1: Select GitHub Repo During Project Creation
As a user, I want to select a GitHub repo from a dropdown during project creation so that the AI can reference its details (e.g., README, issues) in chats for context.

- **Subtasks**:
  1. In `src/lib/db/pg/schema.pg.ts`, add optional `githubRepoUrl: string` field to the projects table schema.
  2. In `src/types/project.ts`, extend TypeScript interface with `githubRepoUrl?: string`.
  3. In `src/app/api/project/actions.ts`, extend create action to include repo URL (validate with Zod schema).
  4. In `src/components/project/create-project-modal.tsx`, add dropdown component fetching user repos via new SWR hook (use `src/hooks/queries/use-projects.ts` pattern; call GitHub API via new server action in `src/app/api/project/github-repos/route.ts` referencing `src/lib/auth/oauth-redirect.ts` for token).
  5. Generate and run Drizzle migration via script in `scripts/db-migrate.ts` to update DB.

- **Acceptance Criteria**:
  - Project creation form shows a "Select GitHub Repo" dropdown populated with user's accessible repos (lists name + URL).
  - Selecting a repo saves `githubRepoUrl` to the DB without errors (Zod validates as string).
  - Existing projects without repo remain functional (optional field).
  - Playwright test: User creates project, selects repo, submits—verify repo URL in DB via query.
  - Vitest unit test: Mock GitHub API fetch returns repos; ensure dropdown renders correctly.

### User Story 2: Edit GitHub Repo in Project Edit UI
As a user, I want to edit the GitHub repo URL in the project edit UI so that I can update or remove integrations without recreating the project.

- **Subtasks**:
  1. In `src/app/api/project/[id]/route.ts`, add PUT endpoint for updating `githubRepoUrl` (extend existing update action; validate with Zod).
  2. In `src/lib/db/pg/repositories/project-repository.pg.ts`, add method to update `githubRepoUrl` (use Drizzle updates).
  3. In `src/components/project/project-detail-page.tsx`, add edit form field for repo URL (reuse creation dropdown logic from subtask 4 in Story 1).
  4. Extend SWR hook in `src/hooks/queries/use-projects.ts` to refetch on edit submit.
  5. Update `src/middleware.ts` to ensure RBAC allows edit access (check user ownership).

- **Acceptance Criteria**:
  - Edit UI displays current `githubRepoUrl` in an editable dropdown (fetches fresh repos on open).
  - Updating repo saves to DB and reflects immediately in project details view.
  - RBAC test: Non-owners cannot edit (403 error via Playwright).
  - Playwright test: Load project page, edit repo, submit—verify updated URL in DB.
  - Vitest unit test: Server action updates field without breaking other project data.

### User Story 3: Auto-Inject GitHub Repo Context in Chats
As a user, when I @mention a project in a chat, I want the repo details injected as XML context so that the AI references it automatically.

- **Subtasks**:
  1. In `src/app/api/chat/actions.ts`, enhance message processing to detect @project patterns (use regex or fuzzy search from `src/lib/fuzzy-search.ts`).
  2. If project detected, fetch repo details via GitHub API (add method to `src/lib/db/pg/repositories/project-repository.pg.ts` to get `githubRepoUrl`).
  3. In `src/lib/ai/prompts.ts`, update prompt assembly to include repo URL/tech stack as secure XML (escape for injection; reference existing XML formatting).
  4. Ensure MCP manager in `src/lib/ai/mcp/mcp-manager.ts` incorporates this in agent prompts.
  5. Add logging in `src/lib/logger.ts` for context injection events.

- **Acceptance Criteria**:
  - @project mention in chat triggers repo fetch and XML injection without errors.
  - AI response includes repo context (e.g., "Based on your GitHub repo...").
  - Playwright test: Simulate @mention in chat UI; verify XML in prompt logs (no leaks).
  - Vitest unit test: Mock fetch returns repo; ensure prompt assembly adds XML correctly.
  - Security: No raw user input in XML; Zod validates context structure.

### User Story 4: Display and Edit Tech Stack in UI
As a user, I want to view and edit the project's tech stack directly in the edit UI so that it's flexible and visible without recreation.

- **Subtasks**:
  1. In `src/lib/db/pg/schema.pg.ts`, ensure `techStack` is an editable array of strings (add if missing).
  2. In `src/types/project.ts`, update interface for mutable `techStack: string[]`.
  3. In `src/app/api/project/[id]/route.ts`, extend update action to handle `techStack` array (Zod array validation).
  4. In `src/components/project/project-detail-page.tsx`, add editable textarea/multi-input for tech stack (display current values on load).
  5. Extend `src/hooks/queries/use-projects.ts` to include tech stack in fetches.

- **Acceptance Criteria**:
  - Project detail page shows tech stack as editable list; updates save to DB on submit.
  - Invalid inputs (e.g., empty array) are rejected by Zod with user-friendly errors.
  - Playwright test: Edit tech stack in UI; verify array update in DB.
  - Vitest unit test: Action handles array validation and DB persistence.

### User Story 5: Secure GitHub API Access for Repo Fetch
As a developer, I want secure token handling for GitHub fetches so that users can select repos without exposing API keys.

- **Subtasks**:
  1. In `src/lib/auth/oauth-redirect.ts`, extend GitHub OAuth to scope `repo` permissions.
  2. In new `src/app/api/project/github-repos/route.ts`, create GET endpoint to list repos (use token from session in `src/lib/auth/permissions.ts`).
  3. In `src/components/project/create-project-modal.tsx`, pass OAuth token to fetch (no client-side storage).
  4. Add RBAC in endpoint: Only authenticated users can access their repos.
  5. Test in `tests/user/user-name-sync.spec.ts` pattern (extend for GitHub flow).

- **Acceptance Criteria**:
  - Repo dropdown fetches only user's repos (no public access without OAuth).
  - Tokens are server-side only; client sees sanitized list.
  - Playwright test: OAuth flow lists repos; invalid token returns error.
  - Vitest unit test: Endpoint validates token and returns repos matching user.

### User Story 6: Testable Integration for Context Injection (Bonus)
As a developer, I want full test coverage for repo/tech stack injection so that chats remain stable.

- **Subtasks**:
  1. In `src/lib/db/pg/repositories/project-repository.pg.ts`, add query method for context injection.
  2. In `tests/projects/project-crud.spec.ts`, add tests for repo/tech stack updates.
  3. In `tests/core/unauthenticated.spec.ts`, extend for chat context mocks.
  4. Run full E2E via `playwright.config.ts` (add scenario for @mention).
  5. Document in `docs/tips-guides/` (new section on GitHub integration).

- **Acceptance Criteria**:
  - >90% coverage for new code; no regressions in existing tests.
  - E2E test: Full flow from project creation to chat injection passes.
  - Vitest: Mocked repo fetch; prompt includes XML without errors.
