Feature Blueprint: Collaborative AI-Powered Projects
High-Level Architectural Approach (Final)
The "Projects" feature will be implemented as a complete, collaborative entity within the system. It will support the full CRUD lifecycle, sharing with different permission levels (view/edit), and archiving for lifecycle management. The primary user interface for managing projects will be a dashboard at /projects, designed to be visually and functionally consistent with the /workflow and /agents pages, featuring a tabbed layout, robust search, and filtering. The AI's role will be elevated from a simple context-aware assistant to a proactive project manager, capable of summarizing status, querying deliverables, and managing the project conversationally via an expanded toolset.
Phase 1: Definition & Scaffolding (The Contract)
This phase establishes the immutable data structures and is the non-negotiable foundation.
Define Types (src/types/project.ts - New File):
DeliverableStatus: 'not-started' | 'in-progress' | 'done'.
ProjectPermissionLevel: 'view' | 'edit'.
ProjectShare: { userId: string; permissionLevel: ProjectPermissionLevel; }
Deliverable: { id: string; name: string; status: DeliverableStatus; ... }
ProjectVersion: { id: string; name: string; deliverables: Deliverable[]; ... }
Project: { id: string; name: string; isArchived: boolean; shares: ProjectShare[]; ... }
Define Database Schema (src/lib/db/pg/schema.pg.ts):
projects Table: Add isArchived (boolean, default false).
projectVersions & deliverables Tables: As previously defined.
projectShares Table (New): A join table with projectId, userId, and permissionLevel. Define a composite primary key on (projectId, userId).
chatThreads Table: Add nullable projectId foreign key.
Define Runtime Validation (src/app/api/project/validations.ts - New File):
Create a comprehensive set of Zod schemas for every mutation: createProjectSchema, updateProjectSchema, createProjectVersionSchema, updateProjectVersionSchema, createDeliverableSchema, updateDeliverableSchema, updateDeliverableStatusSchema, shareProjectSchema, deleteSchema.
Create Database Migration:
Run pnpm db:generate. Carefully review the generated SQL migration file to confirm it correctly adds the new tables, columns, and relationships.


### **Milestone 1: The Read-Only Foundation & Core Data Model**

**Goal:** To establish the complete data model for the "Projects" feature and implement the foundational vertical slice, allowing a user to create a project and view its details. This milestone validates the core architecture and provides the essential scaffolding for all future enhancements.

---

### **Epics & User Stories**

#### **Epic 1: Project Data Modeling & Persistence**

> As an Engineer, I need the database schema and data access layer for Projects, Versions, and Deliverables to be fully implemented, so that the application can securely store and retrieve project data.

*   **User Story 1.1:** As an Engineer, I want to define the database tables for `projects`, `projectVersions`, `deliverables`, and `projectShares` using Drizzle ORM, so that the data structure is version-controlled and type-safe.
*   **User Story 1.2:** As an Engineer, I want to create a `ProjectRepository` that encapsulates all database queries, so that business logic remains decoupled from the persistence layer.
*   **User Story 1.3:** As an Engineer, I want to implement and unit-test the `createProject` method, which also creates a default initial version, to ensure new projects are created correctly.
*   **User Story 1.4:** As an Engineer, I want to implement and unit-test the `findProjectsByUserId` and `findProjectById` methods to securely retrieve project data for the logged-in user.

#### **Epic 2: Core Project Creation UI**

> As a User, I want to create a new project with a name, description, and tech stack, so that I can start organizing my work.

*   **User Story 2.1:** As a User, I want to see a new "Projects" item in the main application sidebar that navigates me to a dedicated projects dashboard at `/projects`.
*   **User Story 2.2:** As a User, on the `/projects` dashboard, I want to see a "Create Project" button that opens a modal form.
*   **User Story 2.3:** As a User, I want to fill out the form with a project name, description, and a list of tech stack items and submit it to create my project.
*   **User Story 2.4:** As a User, after creating a project, I want to see it appear as a card on my `/projects` dashboard.

#### **Epic 3: Project Read-Only View**

> As a User, I want to view the details of a project I have created, so that I can see its versions and deliverables.

*   **User Story 3.1:** As a User, I want to be able to click on a project card on the dashboard to navigate to a detailed view page at `/projects/[id]`.
*   **User Story 3.2:** As a User, on the project detail page, I want to see the project's name, description, and tech stack displayed clearly.
*   **User Story 3.3:** As a User, on the project detail page, I want to see a list of all its versions (initially, just the default one) and the deliverables within each version, all in a read-only format.

---

### **Tasks & Acceptance Criteria**

Here are the specific, actionable tasks derived from the user stories.

#### **Task 1.1: Define and Migrate Database Schema**
*   **Description:** Implement the Drizzle ORM schemas for `projects`, `projectVersions`, `deliverables`, and `projectShares` in `src/lib/db/pg/schema.pg.ts`. Add the `projectId` column to the `chatThreads` table.
*   **Acceptance Criteria:**
    *   ✅ All required tables and columns are defined with correct types and foreign key relationships (with `onDelete` actions).
    *   ✅ A new migration file is successfully generated by running `pnpm db:generate`.
    *   ✅ The migration applies cleanly to an empty database via `pnpm db:migrate`.

#### **Task 1.2: Implement Project Types and Zod Schemas**
*   **Description:** Create `src/types/project.ts` with all necessary TypeScript interfaces. Create `src/app/api/project/validations.ts` with the Zod schema for project creation (`createProjectSchema`).
*   **Acceptance Criteria:**
    *   ✅ TypeScript types for `Project`, `ProjectVersion`, `Deliverable`, etc., are defined and exported.
    *   ✅ `createProjectSchema` correctly validates the `name`, `description`, and `techStack` fields.

#### **Task 1.3 (TDD): Implement `ProjectRepository` Read/Create Methods**
*   **Description:** Create `project-repository.pg.ts` and its corresponding test file. Following TDD, implement and test the `createProject`, `findProjectsByUserId`, and `findProjectById` methods.
*   **Acceptance Criteria:**
    *   ✅ A `project-repository.pg.test.ts` file exists.
    *   ✅ Unit tests for all three methods are written first and initially fail.
    *   ✅ The repository methods are implemented to make all tests pass.
    *   ✅ The `createProject` method correctly creates a project and a default "V1" `ProjectVersion` in a single transaction.
    *   ✅ The `find` methods correctly retrieve data and enforce user ownership in the `WHERE` clause.
    *   ✅ Final unit test coverage for the repository file is **99% or higher**.

#### **Task 1.4 (TDD): Implement `createProject` Server Action**
*   **Description:** Create `src/app/api/project/actions.ts` and its test file. Following TDD, implement the `createProject` Server Action.
*   **Acceptance Criteria:**
    *   ✅ A `actions.test.ts` file exists.
    *   ✅ Unit tests are written to cover: 1) unauthorized access, 2) invalid input data, and 3) successful creation.
    *   ✅ The action correctly checks permissions, validates input with Zod, and calls the (mocked) repository method.
    *   ✅ Final unit test coverage for the action is **99% or higher**.

#### **Task 1.5: Build Project Dashboard UI**
*   **Description:** Create the `/projects` page, which should be visually consistent with `/workflow`. Add the "Projects" link to the main sidebar.
*   **Acceptance Criteria:**
    *   ✅ A new "Projects" link appears in `AppSidebar` and navigates to `/projects`.
    *   ✅ The `/projects` page displays a title, a description, and a "Create Project" button.
    *   ✅ The page fetches and displays a list of projects using `ProjectCard` components.
    *   ✅ A loading skeleton is shown while data is being fetched.
    *   ✅ An empty state is shown if the user has no projects.

#### **Task 1.6: Build Project Creation Modal**
*   **Description:** Create the `CreateProjectModal` component and wire it to the "Create Project" button.
*   **Acceptance Criteria:**
    *   ✅ The modal contains a form with fields for `name` (required), `description`, and `techStack` (a tag-like input).
    *   ✅ Form submission calls the `createProject` Server Action.
    *   ✅ On successful creation, the modal closes, a success toast is shown, and the project list on the dashboard automatically updates.
    *   ✅ Form validation errors are displayed correctly.

#### **Task 1.7: Build Read-Only Project Detail Page**
*   **Description:** Create the `/projects/[id]` page to display project details.
*   **Acceptance Criteria:**
    *   ✅ The page fetches data for a single project using its ID from the URL.
    *   ✅ It correctly displays the project's name, description, and tech stack.
    *   ✅ It displays a list of versions and the deliverables within each version.
    *   ✅ All information is presented in a read-only format (no forms or edit buttons in this phase).
    *   ✅ If a user tries to access a project they don't own, they see a "Not Found" or "Permission Denied" error.

#### **Task 1.8: Write End-to-End Test for Milestone 1**
*   **Description:** Create a new Playwright test file `tests/projects/project-creation.spec.ts`.
*   **Acceptance Criteria:**
    *   ✅ The test successfully logs in as a test user.
    *   ✅ It navigates to the `/projects` page.
    *   ✅ It clicks "Create Project," fills out the form, and submits it.
    *   ✅ It asserts that a success toast appears.
    *   ✅ It asserts that the new project card is now visible on the dashboard.
    *   ✅ It clicks the new project card.
    *   ✅ It asserts that the URL is now `/projects/[id]`.
    *   ✅ It asserts that the project's name and description are correctly displayed on the detail page.
    *   ✅ The test passes reliably in the CI/CD pipeline.
