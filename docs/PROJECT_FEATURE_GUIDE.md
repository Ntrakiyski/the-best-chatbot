# Project Feature - User Guide

## Overview

The Project Feature enables you to organize your work with AI-powered context awareness. When you link a chat to a project, the AI assistant automatically receives the project's context (description, tech stack, deliverables) in its system prompt, enabling more relevant and accurate responses.

## Key Features

✅ **Project Management** - Create and manage projects with versions and deliverables
✅ **AI Context Injection** - Link chats to projects for context-aware AI assistance
✅ **Custom System Prompts** - Define project-level AI instructions in XML format
✅ **Project Mentions** - Reference projects in chat using `@` mentions
✅ **Version Tracking** - Organize deliverables into project versions

## Getting Started

### 1. Creating a Project

1. Navigate to `/projects` or click "Projects" in the sidebar
2. Click the **"Create Project"** button
3. Fill in the project details:
   - **Name** (required): A descriptive name for your project
   - **Description** (optional): What the project is about
   - **Tech Stack** (optional): Technologies used (comma-separated)
4. Click **"Create"**

### 2. Editing a Project

1. Go to `/projects` and click on a project card
2. Click the **"Edit"** button at the top of the detail page
3. You can now edit:
   - Project name and description
   - Tech stack
   - **Custom AI System Prompt** (see below)
4. Click **"Save"** to persist your changes

### 3. Custom AI System Prompt (Project-Level)

The system prompt allows you to customize AI behavior when the project is active in chat.

**Location:**
1. Navigate to `/projects`
2. Click on your project to open the detail page
3. Click **"Edit"**
4. Scroll down to find **"Custom AI System Prompt (XML)"** textarea
5. Enter XML-formatted instructions
6. Click **"Save"**

**Example System Prompt:**
```xml
<project_context>
  <role>Senior Full-Stack Developer specializing in React and Node.js</role>
  <guidelines>
    <guideline>Always suggest TypeScript over JavaScript</guideline>
    <guideline>Prefer functional components with hooks</guideline>
    <guideline>Follow the repository pattern for data access</guideline>
  </guidelines>
  <coding_standards>
    <standard>Use Zod for runtime validation</standard>
    <standard>Write unit tests for all business logic</standard>
    <standard>Use Tailwind CSS for styling</standard>
  </coding_standards>
</project_context>
```

**How It Works:**
- When you link a chat to this project, the system prompt is automatically injected into every AI message
- This allows the AI to follow project-specific guidelines and conventions
- The AI will have context about your tech stack, deliverables, and custom instructions

### 4. Using Projects in Chat

There are two ways to associate a chat with a project:

#### Method A: Project Mentions (@ Symbol)

1. In any chat, type `@` to open the mention menu
2. Your active (non-archived) projects will appear in the list
3. Click on a project to mention it
4. The mention will appear as `@project("Project Name")`
5. Send your message - the AI will have the project context!

**Example:**
```
@project("E-commerce Site") What frontend framework are we using?
```

The AI will respond: "React" (from your project's tech stack) without you needing to specify it in the prompt.

#### Method B: Tools Button

1. Click the **Tools** button next to the chat input
2. Look for the **"Projects"** section
3. Select your project from the dropdown
4. The project will be linked to the current chat thread

### 5. Managing Versions and Deliverables

**Versions** represent milestones or releases of your project.
**Deliverables** are tasks or work items within a version.

**To Add a Version:**
1. Open your project detail page (`/projects/[id]`)
2. Click **"Add Version"**
3. Enter the version name and description
4. Click **"Create"**

**To Add a Deliverable:**
1. In the project detail page, find the version you want to add to
2. Click **"Add Deliverable"** in that version's section
3. Enter:
   - **Name**: Task name
   - **Description**: What needs to be done
   - **Status**: Not Started, In Progress, Done, or Blocked
4. Click **"Create"**

**Deliverable Statuses:**
- 🔵 **Not Started** - Task hasn't been started yet
- 🟡 **In Progress** - Currently working on it
- 🟢 **Done** - Completed
- 🔴 **Blocked** - Cannot proceed due to dependencies

### 6. Archiving Projects

You can archive projects you're no longer actively working on:

1. Open the project detail page
2. Click the **"Archive"** button
3. Archived projects won't appear in mentions or active lists
4. You can unarchive them later if needed

## Troubleshooting

### Projects Not Appearing in Mentions

**Possible Causes:**

1. **Projects Not Loaded**
   - Check browser console for API errors
   - Look for: `[ChatMentionInput] Active projects loaded: [...]`
   - If empty, projects aren't loading from the API

2. **Projects Are Archived**
   - Only non-archived projects appear in mentions
   - Check if your project has `isArchived: true`
   - Unarchive it to make it available

3. **Database Migration Not Run**
   - Ensure you've run `pnpm db:migrate` after pulling latest changes
   - The `system_prompt` column must exist in the database

4. **API Errors**
   - Check `/api/project` endpoint in Network tab
   - Look for 500 errors or database column errors
   - Verify the migration added the `system_prompt` column

### Translation Errors

If you see errors like `MISSING_MESSAGE: Could not resolve 'Project.techStack'`:

1. Ensure `messages/en.json` has all required keys
2. Check the `Project` namespace for:
   - `techStack`
   - `createProject`
   - `namePlaceholder`
   - etc.
3. Restart your dev server after adding translation keys

### System Prompt Not Appearing

The system prompt field is only visible in **Edit Mode**:

1. Go to `/projects/[id]`
2. Click the **"Edit"** button (not just viewing)
3. Scroll down to find the textarea
4. If still not visible, check if the component is rendering the field

## Phase 3 & 4 Implementation Status

### ✅ Completed (Phase 3)
- [x] Project CRUD operations (create, read, update, delete)
- [x] Version and deliverable management
- [x] Project detail page with full editor
- [x] System prompt UI (project-level)
- [x] Project context injection into AI prompts
- [x] Project mentions in chat (`@` symbol)
- [x] Active project filtering (non-archived)
- [x] Database schema with migrations

### 🚧 In Progress / To Verify
- [ ] ProjectSelector component (separate dropdown selector)
- [ ] Chat-project linkage on first message
- [ ] End-to-end test: `tests/projects/project-chat-context.spec.ts`

### 📋 Phase 4 (AI Tools - Not Yet Started)
- [ ] `update_deliverable_status` tool
- [ ] `add_deliverable` tool
- [ ] `get_project_summary` tool
- [ ] `query_deliverables` tool
- [ ] Conditional tool availability based on active project

## API Endpoints

- `GET /api/project` - List all projects
- `GET /api/project?archived=true` - List archived projects
- `GET /api/project?archived=false` - List active projects
- `GET /api/project/[id]` - Get project with versions and deliverables
- `POST /api/project` - Create new project
- `PUT /api/project/[id]` - Update project
- `DELETE /api/project/[id]` - Delete project

## Technical Details

### Project Data Flow

1. **Client** → `useProjects()` hook → `GET /api/project`
2. **Server** → `projectRepository.findProjectsByUserId()`
3. **Database** → PostgreSQL `project` table
4. **Hook** → Filters into `activeProjects`, `archivedProjects`, `myProjects`
5. **UI** → Projects available in mentions, project list, etc.

### Chat Context Injection

When a chat is linked to a project:

1. Chat thread has `projectId` field set
2. On every AI message, the system:
   - Fetches project data via `projectRepository.findProjectById()`
   - Builds project context prompt via `buildProjectContextPrompt()`
   - Merges custom system prompt if defined
   - Prepends to the main system prompt
3. AI receives full context automatically

### Active Projects Filter

```typescript
// In useProjects hook
const activeProjects = projects.filter((project) => !project.isArchived);
```

Only projects with `isArchived: false` appear in chat mentions and selectors.

## Next Steps

1. **Pull PR #11** to get the database migration fix
2. **Run migrations**: `pnpm db:migrate`
3. **Restart dev server**: `bun run dev`
4. **Create a test project** and verify it appears in mentions
5. **Configure system prompt** for your project
6. **Link a chat** to your project and test AI responses

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify database migrations are up to date
3. Check API responses in Network tab
4. Look for debug logs: `[ChatMentionInput]` prefix
5. Review the implementation in:
   - `src/components/chat-mention-input.tsx`
   - `src/hooks/queries/use-projects.ts`
   - `src/lib/ai/project-context.ts`

## References

- Phase 3 Spec: `projects-feature/phase3.md`
- Phase 4 Spec: `projects-feature/phase4.md`
- Implementation Notes: `projects-feature/phase3-IMPLEMENTED.md`

