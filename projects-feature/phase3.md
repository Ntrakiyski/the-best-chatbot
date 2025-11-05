Phase 3: Frontend Implementation (The Experience)
Build the user interface on top of the robust, fully-tested backend.
Routing and Pages:
/projects: The main dashboard.
/projects/[id]: The detailed project editor.
UI/UX Parity and Enhancements:
The /projects page will feature a tabbed interface: "My Projects," "Shared with Me," and "Archived."
Above the list, include a search input and a filter dropdown to enhance usability.
The project list will be rendered using ProjectCard components, each with a dropdown menu containing "Edit," "Duplicate," "Share," "Archive," and "Delete."
Data Fetching (src/hooks/queries/use-projects.ts):
The useProjects hook will be updated to accept parameters for tab, query, and filter, passing them to the backend to fetch the correct data.
All UI mutations (e.g., clicking "Delete") will call the corresponding Server Action and then use SWR's mutate function to automatically re-fetch and update the UI.
UI Components (src/components/project/):
ProjectsListPage.tsx: The main dashboard component managing tabs, search state, and filtering.
ProjectCard.tsx: Displays project summary and the full actions menu.
ProjectEditor.tsx: The comprehensive editor for the /[id] page, allowing management of versions and deliverables.
ShareProjectModal.tsx: A modal for inviting users by email and setting 'View'/'Edit' permissions, consistent with existing sharing UIs.
All necessary CreateEdit... and Delete... modals for projects, versions, and deliverables.
ProjectSelector.tsx: The dropdown in the chat input to associate a chat with a project.

Milestone 3: AI Context Injection
Goal: To make the AI assistant context-aware by dynamically injecting the active project's information into the system prompt. This milestone delivers the core AI value proposition of the feature, transforming the chat from a generic conversation into a project-specific workspace.
Epics & User Stories
Epic 1: Project Context Association
As a User, I want to associate a new chat conversation with one of my projects, so that the AI assistant has the necessary background information to help me effectively.
User Story 1.1: As a User, when I start a new chat, I want to see a new dropdown or button next to the chat input area that allows me to select one of my existing projects.
User Story 1.2: As a User, after selecting a project, I want a visual indicator to confirm that the chat is now "in the context of" that project.
User Story 1.3: As a User, when I send the first message in a new chat with a project selected, I want the system to permanently link that chat thread to the chosen project.
Epic 2: AI Context Awareness
As an AI Assistant, I need to receive the active project's context (description, tech stack, deliverables) within my system prompt, so that I can provide relevant, accurate, and helpful responses.
User Story 2.1: As an Engineer, I want to modify the backend chat logic to detect when a conversation is linked to a project.
User Story 2.2: As an Engineer, when a project is linked, I want to fetch its details (description, tech stack) and the deliverables of its active version from the database.
User Story 2.3: As an Engineer, I want to format this project information into a clear, structured text block and dynamically prepend it to the system prompt for every LLM call within that chat thread.
Epic 3: Contextual Conversation Validation
As a User, I want to be able to ask questions about my selected project and receive answers based on the context I provided, so that I can confirm the AI understands my project's details.
User Story 3.1: As a User, after starting a chat linked to my "E-commerce Site" project (which uses React), I want to ask "What frontend framework are we using?" and get the answer "React" without having to mention it in my prompt.
User Story 3.2: As a User, I want to ask about the current deliverables (e.g., "What are the main tasks for this version?") and have the AI list them out with their current statuses.
Tasks & Acceptance Criteria
These tasks build upon the completed Milestones 1 and 2.
Task 3.1 (TDD): Implement Chat-Project Linkage in Repository
Description: Following TDD, implement and unit-test the addChatToProject({ threadId, projectId, userId }) method in the ProjectRepository.
Acceptance Criteria:
✅ A new unit test is added to project-repository.pg.test.ts that initially fails.
✅ The method is implemented to make the test pass.
✅ The method correctly updates the projectId column on the chatThreads table.
✅ The method includes a WHERE clause to ensure the user owns the chat thread they are trying to link.
Task 3.2 (TDD): Implement Dynamic Prompt Injection Logic
Description: Modify the prompt assembly logic in src/lib/ai/prompts.ts. Create a new function, e.g., getProjectContextPrompt(projectId, userId), that fetches and formats the project data.
Acceptance Criteria:
✅ A new unit test file is created for this utility.
✅ The test mocks the ProjectRepository and asserts that the function returns a correctly formatted, structured string containing the project's description, tech stack, and a list of deliverables with their statuses.
✅ The test asserts that the function returns null or an empty string if the project is not found or the user does not have access.
✅ The main prompt-building function is updated to call this new utility and prepend its output to the final system prompt only if the chat thread has a projectId.
Task 3.3: Update Chat Creation Server Action
Description: Modify the Server Action responsible for creating a new chat thread and sending the first message.
Acceptance Criteria:
✅ The action now accepts an optional projectId in its input.
✅ The action's Zod validation schema is updated to include projectId: z.string().optional().
✅ If projectId is present, the action calls the projectRepository.addChatToProject method after the new chat thread is created.
✅ The corresponding unit tests for this action are updated to cover cases with and without a projectId.
Task 3.4: Build and Integrate the ProjectSelector UI Component
Description: Create the ProjectSelector.tsx component and integrate it into the main chat input area.
Acceptance Criteria:
✅ A new ProjectSelector component is created in src/components/project/.
✅ The component uses the useProjects hook to fetch and display a list of the user's non-archived projects in a dropdown/popover.
✅ The component is added to src/components/prompt-input.tsx, positioned logically near the "Tools" or "Agents" selectors.
✅ When a project is selected, its name is displayed as a visual tag or badge within the chat input area to provide clear user feedback.
✅ The selected project's ID is stored in the parent component's state and passed to the chat creation action upon sending the first message.
✅ The selector is disabled after the first message is sent to lock the context for the duration of the conversation.
Task 3.5: Write End-to-End Test for Milestone 3
Description: Create a new, critical Playwright test file: tests/projects/project-chat-context.spec.ts.
Acceptance Criteria:
✅ The test logs in and programmatically creates a project with a unique, specific detail in its description (e.g., techStack: ['Vortex Engine']).
✅ It navigates to the main chat page.
✅ It clicks the new ProjectSelector dropdown and selects the newly created project.
✅ It asserts that a visual indicator for the selected project appears.
✅ It sends a message: "What rendering engine are we using for this project?"
✅ It waits for the AI's response and asserts that the response text contains the word "Vortex". This is the key validation step.
✅ It sends a second message: "What are the deliverables?" and asserts the AI correctly lists the default deliverables created in Milestone 1.
✅ The test passes reliably in the CI/CD pipeline.
