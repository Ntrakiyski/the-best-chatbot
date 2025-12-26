# Application Analysis

This document provides a comprehensive analysis of the application, covering its purpose, features, user flow, data models, and an overall rating.

## App Description

The "Better Chatbot" is an advanced, project-aware AI assistant designed for developers and teams. It goes beyond simple chat functionalities by integrating intelligent project management, context-aware AI, and powerful automation features.

## Features

- **Project-Aware AI:** Links chats to projects for context-aware assistance, understanding tech stacks, deliverables, and custom instructions.
- **Multi-AI Support:** Seamlessly switches between various AI models like OpenAI, Anthropic, Google, xAI, and Ollama.
- **MCP Protocol:** Extends capabilities with pluggable Model Context Protocol (MCP) tools.
- **Powerful Execution:** Runs JS/Python code, performs web searches, and visualizes data directly from the chat.
- **Image Generation:** Creates and edits images using AI (OpenAI DALL-E, Google Gemini, xAI Grok).
- **Visual Workflows:** Allows building custom automations with a graph-based workflow editor.
- **Team Collaboration:** Enables sharing of agents, workflows, and configurations across teams.
- **Voice Assistant:** Offers real-time voice chat with full tool integration.
- **@ Mentions:** Provides quick referencing of projects, agents, workflows, or tools.

## User Flow

1.  **Authentication:** The user signs up or logs in, and a `User` record is created.
2.  **Project Creation:** The user creates a `Project`, defining its name, description, tech stack, and custom system prompts.
3.  **Chat Initiation:** The user starts a `ChatThread` and can link it to a specific `Project` using `@project("Project Name")`.
4.  **Interaction:** The user interacts with the AI, which leverages the project's context to provide intelligent responses and suggestions.
5.  **Tool Usage:** The user can utilize various tools through `@mentions`, such as `@tool('web-search')` or custom agents like `@github_manager`.
6.  **Workflow Automation:** The user can create and execute visual `Workflows` to automate complex, multi-step tasks.
7.  **Collaboration:** The user can share `Projects`, `Agents`, and `Workflows` with other team members.

## Data Models & Schemas

The application uses a PostgreSQL database with Drizzle ORM. The main tables include:

-   **UserTable:** Stores user information, preferences, and authentication details.
-   **ProjectTable:** Manages project-specific data like name, tech stack, and system prompts.
-   **ChatThreadTable & ChatMessageTable:** Store the conversation history and link chats to projects.
-   **AgentTable:** Contains custom AI agents with specific instructions and tool access.
-   **WorkflowTable, WorkflowNodeDataTable, & WorkflowEdgeTable:** Define the structure and logic of visual workflows.
-   **McpServerTable:** Manages configurations for MCP servers and their associated tools.

## Overall Rating: 9/10

The application is highly capable and well-implemented, offering a rich set of features that cater effectively to developers and teams. The project-aware AI and visual workflow builder are standout features that provide significant value. The codebase is modern, leveraging a robust tech stack, and the documentation is comprehensive, making it easy for new developers to get started. The only area for potential improvement would be to expand the range of built-in tools and integrations to further enhance its capabilities.
