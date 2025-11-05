Phase 5: Quality Assurance & Documentation (The Polish)
Validate the entire integrated feature from the user's perspective.
Write Comprehensive End-to-End Tests (tests/projects/):
project-crud.spec.ts: Test the full lifecycle of creating, editing (all sub-entities), and deleting a project from the UI.
project-lifecycle.spec.ts: Test archiving, un-archiving, and duplicating a project.
project-sharing.spec.ts: Test the complete multi-user sharing flow: User A shares with B (view), B logs in and cannot edit. A upgrades B's permission, B logs in and can now edit.
project-chat-interaction.spec.ts:
Test that selecting a project correctly injects context into the chat.
Test all conversational AI commands: "add a deliverable...", "what's the status?", "show me what's done." For each command, assert that the AI calls the correct tool and that the database state is updated correctly.
Update Documentation (/docs):
Create a complete guide for the "Projects" feature, including sections on Sharing & Collaboration, Archiving, and a full list of Conversational AI Commands.
Perform Final Checks:
Run pnpm check and pnpm test:e2e to ensure all unit tests and E2E tests pass and there are no regressions. Submit the PR with a feat: conventional commit title.

Milestone 5: Collaboration & Polish
Goal: To finalize the "Projects" feature by adding robust sharing capabilities, lifecycle management (duplication), and essential UI polish (search and filtering). This milestone ensures the feature is not only powerful for individual users but also seamlessly integrates into a team-based workflow, matching the collaborative standards of other entities in the application like Agents and Workflows.
Epics & User Stories
Epic 1: Collaborative Project Management
As a User, I want to share my projects with team members and control their level of access, so that we can collaborate on planning and tracking work.
User Story 1.1: As a Project Owner, I want to find a "Share" option for my project that opens a modal where I can invite other users by their email address.
User Story 1.2: As a Project Owner, when sharing, I want to assign a permission level of either 'View' (read-only) or 'Edit' (full access) to each collaborator.
User Story 1.3: As a Collaborator, I want to see projects that have been shared with me in a dedicated "Shared with Me" tab on my projects dashboard.
User Story 1.4: As a Collaborator with 'View' access, I want to be able to see all project details and link the project to my chats, but I should not be able to edit or delete anything.
User Story 1.5: As a Collaborator with 'Edit' access, I want to have the same full CRUD permissions as the original owner (except for deleting the project itself).
Epic 2: Enhanced Usability & Workflow Efficiency
As a User with many projects, I want better tools to find and manage my work, so that I can stay organized and efficient.
User Story 2.1: As a User, on the projects dashboard, I want a search bar that allows me to instantly filter my projects by name.
User Story 2.2: As a User, I want a "Duplicate" option for my projects, so I can quickly create a new project based on an existing template or structure without starting from scratch.
User Story 2.3: As a User, when I duplicate a project, I expect the new project to be a deep copy of the original, including its active version and all of its deliverables, but with me as the new owner.
Tasks & Acceptance Criteria
These tasks focus on building the final layer of professional features and ensuring they are tested for a multi-user environment.
Task 5.1 (TDD): Implement Sharing and Duplication Logic in Repository
Description: Following TDD, implement the final set of methods in ProjectRepository. This includes updating existing methods to be permission-aware.
Acceptance Criteria:
✅ Permission Logic: The findProjectsByUserId method is updated to correctly UNION projects owned by the user with projects shared with them. The findProjectById method is updated to check both ownership and share permissions.
✅ Sharing Methods (TDD): The shareProject, unshareProject, and updateSharePermission methods are fully implemented and unit-tested. Tests must cover adding the first collaborator, updating permissions, and removing access.
✅ Duplication Method (TDD): A duplicateProject({ projectId, newOwnerId }) method is implemented and unit-tested. The test must assert that a deep copy is created (new project, new version, new deliverables) and that the new project is correctly assigned to the newOwnerId.
✅ Final unit test coverage for the repository file remains 99% or higher.
Task 5.2 (TDD): Implement Sharing and Duplication Server Actions
Description: Following TDD, implement the shareProject and duplicateProject Server Actions in src/app/api/project/actions.ts.
Acceptance Criteria:
✅ Unit tests are written for both actions, covering unauthorized access (only the owner can share/duplicate), invalid input, and successful execution.
✅ The actions correctly call their corresponding (mocked) repository methods.
✅ The shareProject action includes logic to find the target user by email before creating the share record.
✅ Final unit test coverage for the new actions is 99% or higher.
Task 5.3: Build the Collaboration and Polish UI
Description: Implement the final UI components for sharing, duplication, and filtering.
Acceptance Criteria:
✅ The /projects dashboard now includes a "Shared with Me" tab that correctly displays projects shared with the current user.
✅ A search bar is added to the dashboard, and its state is used to filter the projects displayed in real-time.
✅ The ProjectCard dropdown menu now includes a "Share" option that opens a ShareProjectModal.
✅ The ShareProjectModal allows searching for users by email, assigning 'View'/'Edit' roles, and viewing/removing existing collaborators. It should be visually consistent with other sharing modals in the app.
✅ The ProjectCard dropdown menu includes a "Duplicate" option that, when clicked, calls the duplicateProject action and shows a success toast.
Task 5.4: Implement Permission-Based UI Rendering
Description: Update the project editor page (/projects/[id]) to be permission-aware.
Acceptance Criteria:
✅ The page's data-fetching logic now includes the user's permission level for the project.
✅ If the user has 'View' permission, all form fields, "Save" buttons, "Add" buttons, and "Delete" buttons are disabled or hidden.
✅ If the user has 'Edit' permission or is the owner, all controls are enabled.
Task 5.5: Write End-to-End Tests for Milestone 5
Description: Create the final, critical multi-user and workflow tests in Playwright.
Acceptance Criteria:
✅ A new test file, tests/projects/project-sharing.spec.ts, is created. This test requires a multi-user setup.
It logs in as User A, creates a project.
It shares the project with User B with 'View' permissions.
It logs in as User B, navigates to the "Shared with Me" tab, and asserts the project is visible.
It navigates to the project's detail page and asserts that all edit/delete controls are disabled.
It logs back in as User A and upgrades User B's permission to 'Edit'.
It logs back in as User B, navigates to the detail page, and asserts that it can now successfully edit a deliverable's name.
✅ A new test in project-lifecycle.spec.ts covers the duplication workflow:
It creates a project, clicks "Duplicate."
It asserts that a new project card appears on the dashboard with a name like "[Original Name] (Copy)."
✅ A new test in project-crud.spec.ts covers the search functionality, asserting that typing in the search bar correctly filters the list of projects.
✅ All tests pass reliably in the CI/CD pipeline.
Task 5.6: Final Documentation Update
Description: Create the final, comprehensive guide for the "Projects" feature.
Acceptance Criteria:
✅ A new documentation file is created in /docs.
✅ It includes sections on Creating Projects, Managing Versions & Deliverables, Sharing & Collaboration, Archiving & Duplicating, and a full list of Conversational AI Commands.
