# V2 Improvements Plan

This folder contains a phased roadmap for enhancing "The Best Chatbot" with GitHub integration, editable tech stacks, XML prompt generation, project versioning, live docs for agents, and project-linked chat history. 

## Instructions for AI Agents/Developers
1. **Adopt Persona**: Before starting any phase, thoroughly review `AGENTS.md` in the repo root. Adopt the role of the expert architect and engineer: Focus on modularity (abstractions/interfaces), security (Zod validation + RBAC), testability (TDD with >90% coverage via Vitest/Playwright), and automation (CI/CD-ready with scripts).
2. **Implementation Order**: Phases are sequential—complete Phase 1 fully (including tests) before Phase 2, etc. Use vertical slicing: Define types/schema first, then backend (repositories/actions), frontend (UI/hooks), and finally tests.
3. **General Rules**:
   - Every change must maintain backward compatibility.
   - Use existing patterns: Drizzle for DB, SWR/Zustand for state, MCP for tools, Zod for validation.
   - Commit to feature branches (e.g., `feat/v2-phase1`).
   - Run full tests: `pnpm test` (Vitest units) + `pnpm test:e2e` (Playwright).
   - Update docs in `/docs/` if needed; add i18n to `messages/en.json`.
4. **End Goal**: After all phases, the app will have deeper GitHub/project integration for context-aware AI chats.

Phases:
- [ ] Phase 1: GitHub Repo Integration and Editable Tech Stack
- [ ] Phase 2: ✨ Button and Project Versions
- [ ] Phase 3: Live Docs for Agents
- [ ] Phase 4: Project-Assigned Chats and History Views