import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";

test.describe("Project Chat Context Integration (Phase 3)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("AI receives project context when project is mentioned in chat", async ({
    page,
  }) => {
    // Step 1: Create a project with unique tech stack for verification
    await page.goto("/projects");
    await page.click('[data-testid="create-project-button"]');

    const uniqueTech = `VortexEngine-${Date.now()}`;
    const projectName = `E2E Context Test ${Date.now()}`;

    await page.fill('[data-testid="project-name-input"]', projectName);
    await page.fill(
      '[data-testid="project-description-input"]',
      "Test project for AI context injection",
    );

    // Add unique technology to tech stack
    const techInput = page.locator('[data-testid="tech-stack-input"]');
    await techInput.fill(uniqueTech);
    await techInput.press("Enter");

    await page.click('[data-testid="create-project-submit"]');
    await expect(page.locator("text=Project created")).toBeVisible();

    // Step 2: Navigate to the created project
    await page.click(`text=${projectName}`);
    await expect(
      page.locator('[data-testid="project-detail-card"]'),
    ).toBeVisible();

    // Step 3: Add a version
    await page.click('[data-testid="add-version-button"]');
    await page.fill('[data-testid="version-name-input"]', "V1.0");
    await page.fill(
      '[data-testid="version-description-input"]',
      "Initial version",
    );
    await page.click('[data-testid="create-version-submit"]');
    await expect(page.locator("text=Version created")).toBeVisible();

    // Step 4: Add a deliverable with description
    await page.click('[data-testid="add-deliverable-button"]');
    await page.fill(
      '[data-testid="deliverable-name-input"]',
      "Unique Feature Authentication",
    );
    await page.fill(
      '[data-testid="deliverable-description-input"]',
      "Implement JWT-based authentication with refresh tokens",
    );
    await page.click('[data-testid="create-deliverable-submit"]');
    await expect(page.locator("text=Deliverable created")).toBeVisible();

    // Step 5: Edit project to add custom system prompt
    await page.click('[data-testid="edit-project-button"]');

    const systemPromptInput = page.locator(
      '[data-testid="system-prompt-input"]',
    );
    await systemPromptInput.fill(
      "You are an expert in rendering engines. Always mention the rendering engine when discussing graphics.",
    );

    await page.click('[data-testid="save-project-button"]');
    await expect(page.locator("text=Project updated")).toBeVisible();

    // Step 6: Navigate to chat
    await page.goto("/chat");
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Step 7: Start a new chat mentioning the project
    await page.click('[data-testid="new-chat-button"]');

    // Type the project mention
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(`@${projectName}`);

    // Select the project from mentions dropdown
    await page.click(`[data-testid="mention-option-${projectName}"]`);

    // Submit the initial message
    await chatInput.press("Enter");
    await expect(
      page.locator('[data-testid="chat-message"]').first(),
    ).toBeVisible();

    // Step 8: Ask about the tech stack
    await chatInput.fill("What rendering engine are we using in this project?");
    await chatInput.press("Enter");

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-message"]', {
      timeout: 15000,
    });

    // Step 9: Verify AI knows about the unique tech stack
    const aiResponse = await page
      .locator('[data-testid="ai-message"]')
      .last()
      .textContent();

    expect(aiResponse).toContain(uniqueTech);

    // Step 10: Ask about deliverables
    await chatInput.fill("What are the main deliverables for this project?");
    await chatInput.press("Enter");

    await page.waitForSelector('[data-testid="ai-message"]', {
      timeout: 15000,
    });

    const deliverableResponse = await page
      .locator('[data-testid="ai-message"]')
      .last()
      .textContent();

    // Verify AI mentions the deliverable
    expect(deliverableResponse).toContain("Unique Feature Authentication");

    // Step 11: Verify custom system prompt is being applied
    await chatInput.fill("Tell me about graphics in this project");
    await chatInput.press("Enter");

    await page.waitForSelector('[data-testid="ai-message"]', {
      timeout: 15000,
    });

    const customPromptResponse = await page
      .locator('[data-testid="ai-message"]')
      .last()
      .textContent();

    // Custom prompt should influence AI to mention rendering engine
    expect(customPromptResponse?.toLowerCase()).toContain("rendering");
  });

  test("AI chat works without project context (backward compatibility)", async ({
    page,
  }) => {
    // Navigate to chat without mentioning any project
    await page.goto("/chat");
    await page.click('[data-testid="new-chat-button"]');

    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill("Hello, can you help me?");
    await chatInput.press("Enter");

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-message"]', {
      timeout: 15000,
    });

    const aiResponse = await page
      .locator('[data-testid="ai-message"]')
      .first()
      .textContent();

    // Should get a normal response without errors
    expect(aiResponse).toBeTruthy();
    expect(aiResponse?.length).toBeGreaterThan(10);
  });

  test("Project context updates when deliverable status changes", async ({
    page,
  }) => {
    // Create project with deliverable
    await page.goto("/projects");
    await page.click('[data-testid="create-project-button"]');

    const projectName = `Status Test ${Date.now()}`;

    await page.fill('[data-testid="project-name-input"]', projectName);
    const techInput = page.locator('[data-testid="tech-stack-input"]');
    await techInput.fill("React");
    await techInput.press("Enter");

    await page.click('[data-testid="create-project-submit"]');
    await page.click(`text=${projectName}`);

    // Add version and deliverable
    await page.click('[data-testid="add-version-button"]');
    await page.fill('[data-testid="version-name-input"]', "V1");
    await page.click('[data-testid="create-version-submit"]');

    await page.click('[data-testid="add-deliverable-button"]');
    await page.fill('[data-testid="deliverable-name-input"]', "Login Page");
    await page.click('[data-testid="create-deliverable-submit"]');

    // Start chat with project mentioned
    await page.goto("/chat");
    await page.click('[data-testid="new-chat-button"]');

    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(`@${projectName}`);
    await page.click(`[data-testid="mention-option-${projectName}"]`);
    await chatInput.press("Enter");

    // Ask about deliverable status
    await chatInput.fill("What is the status of the Login Page deliverable?");
    await chatInput.press("Enter");

    await page.waitForSelector('[data-testid="ai-message"]', {
      timeout: 15000,
    });

    const response1 = await page
      .locator('[data-testid="ai-message"]')
      .last()
      .textContent();

    // Should mention "not started" status
    expect(response1?.toLowerCase()).toMatch(/not.*start|pending|todo/);

    // Change deliverable status to in-progress
    await page.goto("/projects");
    await page.click(`text=${projectName}`);

    // Update status via dropdown
    await page.click('[data-testid="deliverable-status-select"]');
    await page.click('[data-testid="status-option-in-progress"]');
    await expect(page.locator("text=Status updated")).toBeVisible();

    // Go back to same chat and ask again
    await page.goto("/chat");
    await chatInput.fill("What is the current status of Login Page now?");
    await chatInput.press("Enter");

    await page.waitForSelector('[data-testid="ai-message"]', {
      timeout: 15000,
    });

    const response2 = await page
      .locator('[data-testid="ai-message"]')
      .last()
      .textContent();

    // Should now mention "in progress" status
    expect(response2?.toLowerCase()).toMatch(/in.*progress|working|ongoing/);
  });
});
