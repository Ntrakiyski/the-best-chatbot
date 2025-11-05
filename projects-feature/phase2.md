Phase 2: Backend Implementation (TDD Cycle)
All backend logic will be developed using a strict Red-Green-Refactor cycle to achieve near-100% unit test coverage.
[RED] Write Failing Repository Tests (src/lib/db/pg/repositories/project-repository.pg.test.ts):
Before writing any implementation code, create the test file for ProjectRepository.
Write comprehensive Vitest tests for every required method: createProject, findProjectById (including permission checks for shared projects), updateProject, deleteProject, archiveProject, shareProject, etc.
Use mocks for the database instance to isolate repository logic.
Run pnpm test:watch and confirm all tests fail as expected.
[GREEN] Implement Repository Logic (project-repository.pg.ts):
Write the minimal Drizzle query code inside the ProjectRepository methods to make the failing tests pass. Your find methods must now correctly join with the projectShares table to handle shared access.
Run the tests continuously until all are green.
[REFACTOR] Refine Repository Code:
With the safety of a full test suite, refactor the repository code for clarity, performance, and adherence to coding standards without changing its behavior.
Repeat TDD Cycle for Server Actions (src/app/api/project/actions.ts):
Create actions.test.ts for your project-related Server Actions.
[RED]: Write failing tests for each action (e.g., createProject, shareProject). Mock the repository methods and the permission-checking functions (can(...)). Test all edge cases: unauthorized access, invalid input (Zod error), and successful execution.
[GREEN]: Implement the Server Action logic: 1) Check session, 2) Check permissions, 3) Validate input with Zod, 4) Call the (already tested) repository method.
[REFACTOR]: Clean up the action code.
Repeat TDD Cycle for AI Tools:
For the new AI tool functions (get_project_summary, query_deliverables), follow the same TDD process. Write tests that mock the repository and assert that the tool returns the correctly formatted data.

Milestone 2: Full CRUD and Lifecycle Management
Goal: To empower the user with complete control over their projects, versions, and deliverables. This milestone transforms the read-only views into fully interactive management interfaces, allowing users to edit, delete, and archive their work directly through the UI.
Epics & User Stories
Epic 1: Project Editing & Lifecycle
As a User, I want to edit the details of my projects and manage their lifecycle by archiving or deleting them, so that I can keep my project information up-to-date and my workspace organized.
User Story 1.1: As a User, I want to find an "Edit" option on my project card that takes me to the project's detail page, which is now an editable form.
User Story 1.2: As a User, on the project editor page, I want to be able to change the project's name, description, and tech stack and save my changes.
User Story 1.3: As a User, I want to have an "Archive" option for my projects, so I can hide them from my main dashboard without permanently deleting them.
User Story 1.4: As a User, I want to view my archived projects in a separate "Archived" tab and have the option to unarchive them.
User Story 1.5: As a User, I want a "Delete" option for my projects, with a confirmation step, to permanently remove them.
Epic 2: Version & Deliverable Management
As a User, on the project editor page, I want to manage the versions of my project and the deliverables within each version, so that I can accurately plan and track my work.
User Story 2.1: As a User, I want to be able to add a new version (e.g., "V2") to my project, giving it a name and description.
User Story 2.2: As a User, I want to be able to edit the name and description of an existing version.
User Story 2.3: As a User, within a specific version, I want to add new deliverables by just providing a name.
User Story 2.4: As a User, I want to edit the name of an existing deliverable.
User Story 2.5: As a User, I want to change the status of a deliverable using a dropdown (Not Started, In Progress, Done).
User Story 2.6: As a User, I want to be able to delete versions and deliverables I no longer need.
Tasks & Acceptance Criteria
These tasks assume that all Milestone 1 components and backend logic are in place.
Task 2.1 (TDD): Implement ProjectRepository Update/Delete/Lifecycle Methods
Description: Following TDD, implement and unit-test the remaining methods in ProjectRepository: updateProject, deleteProject, archiveProject, unarchiveProject, and all CRUD methods for ProjectVersion and Deliverable.
Acceptance Criteria:
✅ A project-repository.pg.test.ts file is expanded with new tests for each method.
✅ Tests for all update/delete methods are written first and initially fail.
✅ The repository methods are implemented to make all tests pass.
✅ Every method strictly enforces user ownership in its WHERE clause (e.g., ...where(and(eq(projects.id, projectId), eq(projects.userId, userId)))).
✅ The deleteProject method correctly cascades deletes to child versions and deliverables.
✅ Final unit test coverage for the repository file remains 99% or higher.
Task 2.2 (TDD): Implement All Remaining Server Actions
Description: Following TDD, implement the full suite of Server Actions in src/app/api/project/actions.ts: updateProject, deleteProject, archiveProject, unarchiveProject, createVersion, updateVersion, deleteVersion, createDeliverable, updateDeliverable, deleteDeliverable, and updateDeliverableStatus.
Acceptance Criteria:
✅ The actions.test.ts file is expanded with unit tests for every new action.
✅ Each test covers unauthorized access, invalid input, and successful execution scenarios.
✅ Each action correctly calls its corresponding (mocked) repository method.
✅ Final unit test coverage for the actions file is 99% or higher.
Task 2.3: Enhance Project Dashboard UI
Description: Update the /projects page to include lifecycle management features.
Acceptance Criteria:
✅ The ProjectCard component now has a dropdown menu with "Edit," "Archive," and "Delete" options.
✅ Clicking "Delete" opens a DeleteProjectDialog that requires the user to confirm the action.
✅ The dashboard now has tabs for "My Projects" and "Archived."
✅ The useProjects hook is updated to fetch projects based on the active tab (isArchived status).
✅ Clicking "Archive" on a project moves it from the "My Projects" list to the "Archived" list, and an "Unarchive" option appears in its menu.
Task 2.4: Build the Interactive Project Editor Page
Description: Transform the read-only /projects/[id] page into a fully interactive editor.
Acceptance Criteria:
✅ The project's name, description, and tech stack are now displayed in editable form fields with a "Save Changes" button that calls the updateProject action.
✅ A VersionManager component displays versions in an accordion or similar UI.
✅ Each version section has a "New Deliverable" button that opens a modal/inline form to call the createDeliverable action.
✅ Each deliverable is rendered as a row with an editable name, a status dropdown, and a delete button, all wired to their respective Server Actions.
✅ Each version has its own menu to edit or delete the version.
✅ All UI mutations provide immediate user feedback (e.g., loading spinners, success/error toasts) and automatically update the view via SWR's mutate.
Task 2.5: Write End-to-End Tests for Milestone 2
Description: Expand the Playwright test suite to cover all new CRUD and lifecycle functionality.
Acceptance Criteria:
✅ A new test file, tests/projects/project-crud.spec.ts, is created or expanded.
✅ Editing Test: A test logs in, creates a project, navigates to the editor page, changes the project's name, saves it, and asserts the new name is visible on the dashboard.
Deliverable Management Test: A test creates a project, adds a new deliverable, changes its status to "In Progress," edits its name, and finally deletes it, asserting the UI reflects each state change correctly.
Lifecycle Test: A test creates a project, archives it, navigates to the "Archived" tab and asserts it's there, unarchives it, and finally deletes it, asserting it is permanently removed.
✅ All tests pass reliably in the CI/CD pipeline.
