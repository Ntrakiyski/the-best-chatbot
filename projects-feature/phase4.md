Phase 4: AI & Orchestration (The Intelligence)
Make the AI a true project management assistant.
Dynamic Context Injection (src/lib/ai/prompts.ts):
(No changes from the previous plan. This logic remains robust.)
Expand Internal Toolset (src/lib/ai/tools/tool-kit.ts):
The following tools will be made available to the LLM only when a project is active in the chat context.
Management Tools: update_deliverable_status, add_deliverable, create_new_version.
Analysis Tools (New):
get_project_summary: Provides a summary of deliverable statuses. (User: "How's this project going?")
query_deliverables: Finds deliverables, optionally filtering by status. (User: "What's left to do?")

Milestone 4: AI Interaction & Tooling
Goal: To empower the AI with a set of internal tools that allow it to conversationally manage the active project. This milestone elevates the user experience from passive context awareness to active, intelligent interaction, allowing users to update their project's state using natural language.
Epics & User Stories
Epic 1: AI-Powered Deliverable Management
As a User, I want to tell the AI assistant when I have started, finished, or want to add a task, and have the system update the project's state automatically, so that I can manage my project without leaving the chat interface.
User Story 1.1: As a User, when in a project-context chat, I want to be able to say "Mark the 'User Authentication' deliverable as done," and have the AI confirm that the status has been updated.
User Story 1.2: As a User, I want to be able to say "Add a new task to write the API documentation," and have the AI create a new deliverable with that name in the current project version.
User Story 1.3: As an AI Assistant, I need a tool called update_deliverable_status that I can call with a deliverable's name and a new status, so I can fulfill user requests to update tasks.
User Story 1.4: As an AI Assistant, I need a tool called add_deliverable that I can call with the name of a new task, so I can add it to the current project.
Epic 2: AI-Powered Project Analysis
As a User, I want to ask the AI for a summary of my project's status or a list of specific tasks, so that I can quickly get an overview of my progress without manually checking the project editor.
User Story 2.1: As a User, I want to be able to ask "What's the status of this project?" and receive a concise summary from the AI (e.g., "You have 5 deliverables in total: 2 are done, 1 is in progress, and 2 have not been started.").
User Story 2.2: As a User, I want to be able to ask "What's left to do?" or "Show me all tasks that are in progress," and have the AI list only the relevant deliverables.
User Story 2.3: As an AI Assistant, I need a tool called get_project_summary that returns the counts of deliverables by status, so I can answer high-level questions about project progress.
User Story 2.4: As an AI Assistant, I need a tool called query_deliverables that allows me to filter deliverables by their status, so I can answer specific questions about what tasks are in a particular state.
Tasks & Acceptance Criteria
These tasks focus on building the "nervous system" that connects the AI's reasoning to your application's backend.
Task 4.1 (TDD): Implement and Unit-Test All AI Tool Functions
Description: In src/lib/ai/tools/tool-kit.ts (or a new, dedicated project-tools.ts), define the Zod schemas and implementation functions for all new tools. Follow TDD for each one.
Acceptance Criteria:
✅ A new test file, project-tools.test.ts, is created.
✅ update_deliverable_status Tool:
The tool's Zod schema correctly defines deliverableName and newStatus parameters.
The implementation function correctly identifies the deliverable by name (within the active project context) and calls the updateDeliverableStatus Server Action.
Unit tests cover cases where the deliverable is found and where it is not found (graceful failure).
✅ add_deliverable Tool:
The tool's Zod schema correctly defines the name parameter.
The implementation function calls the createDeliverable Server Action.
Unit tests validate the successful call path.
✅ get_project_summary Tool:
The tool's Zod schema defines no parameters.
The implementation function calls the projectRepository.findProjectById, calculates the counts of deliverables by status, and returns a structured object or formatted string.
Unit tests cover various scenarios (e.g., no deliverables, all deliverables done, mixed statuses).
✅ query_deliverables Tool:
The tool's Zod schema correctly defines an optional status parameter.
The implementation function filters the project's deliverables and returns a list of matching names and statuses.
Unit tests cover filtering for each status and the case where no status is provided (should return all).
Task 4.2: Integrate Tools into the AI Orchestration Layer
Description: Modify the main chat API logic to conditionally include the new project tools in the toolset available to the LLM.
Acceptance Criteria:
✅ The chat API logic now checks if the current chatThread has a projectId.
✅ If a projectId exists, the four new project tools (update_deliverable_status, add_deliverable, get_project_summary, query_deliverables) are added to the list of tools sent to the LLM provider.
✅ If no projectId exists, these tools are not included, saving tokens and preventing the AI from hallucinating their existence.
Task 4.3: Ensure Real-time UI Updates
Description: Verify that when an AI tool successfully calls a Server Action that modifies project data, the UI reflects the change automatically.
Acceptance Criteria:
✅ The Server Actions for updating/creating deliverables trigger SWR revalidation for the relevant data hooks (e.g., useProject(id)).
✅ When a user tells the AI to "mark task X as done," after the AI responds, the status of task X in the /projects/[id] editor page should update automatically without a manual page refresh. This can be verified during E2E testing.
Task 4.4: Write End-to-End Tests for Milestone 4
Description: Create a new, comprehensive Playwright test file: tests/projects/project-tool-interaction.spec.ts. This is the ultimate validation that the entire system works together.
Acceptance Criteria:
✅ The test sets up a project with a known set of deliverables (e.g., "Task A," "Task B").
✅ It starts a new chat and links it to this project.
✅ Test add_deliverable: The test sends the message, "Add a deliverable named 'Task C'." It then waits for the AI's response and navigates to the project editor page to assert that "Task C" now exists in the deliverable list.
✅ Test update_deliverable_status: The test sends the message, "Mark Task A as complete." It waits for the response and asserts that the status of "Task A" in the UI (or by re-querying the DB via a helper) is now "done."
✅ Test query_deliverables: The test sends the message, "What tasks are not started?" It asserts that the AI's response includes "Task B" but not "Task A."
✅ Test get_project_summary: The test sends the message, "Give me a summary of the project." It asserts that the AI's response contains text like "1 is done" and "1 is not started."
✅ All tests pass reliably in the CI/CD pipeline.
