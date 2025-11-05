import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../constants/test-users";

/**
 * E2E Tests for Projects Feature - Phase 1: Milestone 1
 * Tests the complete user journey from project creation to viewing project details
 */

test.describe("Project Creation and Viewing", () => {
  test.use({ storageState: TEST_USERS.editor.authFile });

  test("should complete full project lifecycle: create, list, and view details", async ({
    page,
  }) => {
    // Generate unique project data
    const timestamp = Date.now();
    const projectName = `Test Project ${timestamp}`;
    const projectDescription = "This is a test project created by E2E tests";
    const projectTechStack = "React, TypeScript, Playwright";

    // Step 1: Navigate to projects dashboard
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Step 2: Verify dashboard loads successfully
    await expect(page.locator("h1")).toContainText("Projects");
    await expect(page.getByTestId("create-project-card")).toBeVisible();

    // Step 3: Click "Create Project" button
    await page.getByTestId("create-project-card").click();

    // Step 4: Verify modal opens with form fields
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByTestId("project-name-input")).toBeVisible();
    await expect(page.getByTestId("project-description-input")).toBeVisible();
    await expect(page.getByTestId("project-techstack-input")).toBeVisible();

    // Step 5: Verify submit button is disabled when name is empty
    const submitButton = page.getByTestId("project-submit-button");
    await expect(submitButton).toBeDisabled();

    // Step 6: Fill in project creation form
    await page.getByTestId("project-name-input").fill(projectName);
    await page
      .getByTestId("project-description-input")
      .fill(projectDescription);
    await page.getByTestId("project-techstack-input").fill(projectTechStack);

    // Step 7: Verify submit button is enabled after filling name
    await expect(submitButton).toBeEnabled();

    // Step 8: Submit the form
    await submitButton.click();

    // Step 9: Verify navigation to project detail page
    await page.waitForURL("**/projects/**", { timeout: 10000 });
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/projects\/[a-f0-9-]+$/);

    // Extract project ID from URL for later use
    const projectId = currentUrl.split("/projects/")[1];
    expect(projectId).toBeTruthy();

    // Step 10: Verify project details are displayed correctly
    await expect(page.getByTestId("project-detail-card")).toBeVisible();
    await expect(page.getByTestId("project-name")).toContainText(projectName);
    await expect(page.getByTestId("project-description")).toContainText(
      projectDescription,
    );

    // Step 11: Verify tech stack badges are displayed
    const techStackContainer = page.getByTestId("tech-stack");
    await expect(techStackContainer).toBeVisible();

    // Verify each tech in the stack appears as a badge
    const techs = projectTechStack.split(",").map((tech) => tech.trim());
    for (const tech of techs) {
      await expect(
        techStackContainer.getByTestId(`tech-badge-${tech}`),
      ).toBeVisible();
    }

    // Step 12: Verify default V1 version is created
    const versionCard = page.locator('[data-testid^="version-card-"]').first();
    await expect(versionCard).toBeVisible();
    await expect(
      page.locator('[data-testid^="version-name-"]').first(),
    ).toContainText("V1");

    // Step 13: Verify default deliverables are present
    const deliverables = [
      "Database schema & migrations",
      "Repository layer & unit tests",
      "Server actions & validation",
      "UI components & pages",
      "E2E tests",
    ];

    for (const deliverableName of deliverables) {
      const deliverable = page
        .locator(`[data-testid^="deliverable-name-"]`)
        .filter({ hasText: deliverableName });
      await expect(deliverable).toBeVisible();
    }

    // Step 14: Verify deliverable statuses are displayed
    const statusBadge = page
      .locator('[data-testid^="deliverable-status-"]')
      .first();
    await expect(statusBadge).toBeVisible();

    // Step 15: Navigate back to dashboard
    await page.getByTestId("back-button").click();
    await page.waitForURL("**/projects");

    // Step 16: Verify project appears in the list
    const projectCard = page.getByTestId(`project-card-${projectId}`);
    await expect(projectCard).toBeVisible();
    await expect(projectCard).toContainText(projectName);

    // Step 17: Verify project card shows description
    if (projectDescription) {
      await expect(projectCard).toContainText(projectDescription);
    }

    // Step 18: Verify project card shows tech stack (first 3 + count)
    const techBadges = projectCard.locator('[data-testid^="tech-badge-"]');
    const visibleTechs = techs.slice(0, 3);
    expect(await techBadges.count()).toBeGreaterThanOrEqual(
      visibleTechs.length,
    );

    // Step 19: Click on project card to navigate back to details
    await projectCard.click();
    await page.waitForURL(`**/projects/${projectId}`);

    // Step 20: Verify we're back on the detail page with correct data
    await expect(page.getByTestId("project-name")).toContainText(projectName);
    await expect(page.getByTestId("project-description")).toContainText(
      projectDescription,
    );
  });

  test("should handle project creation with minimal data (name only)", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const projectName = `Minimal Project ${timestamp}`;

    // Navigate to projects
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Click create
    await page.getByTestId("create-project-card").click();

    // Fill only name
    await page.getByTestId("project-name-input").fill(projectName);

    // Submit
    await page.getByTestId("project-submit-button").click();

    // Verify navigation to detail page
    await page.waitForURL("**/projects/**", { timeout: 10000 });

    // Verify project name is displayed
    await expect(page.getByTestId("project-name")).toContainText(projectName);

    // Verify description is not shown (optional field was empty)
    await expect(page.getByTestId("project-description")).not.toBeVisible();

    // Verify tech stack is not shown (optional field was empty)
    await expect(page.getByTestId("tech-stack")).not.toBeVisible();
  });

  test("should show empty state when no projects exist", async ({ page }) => {
    // Note: This test assumes you can clear projects or use a fresh user
    // For now, we'll just verify the empty state structure exists in the page

    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // If there are no active projects, the empty state should be visible
    const projectCards = page.locator('[data-testid^="project-card-"]');
    const projectCount = await projectCards.count();

    if (projectCount === 0) {
      // Verify empty state is shown
      await expect(page.getByText("No projects yet")).toBeVisible();
      await expect(
        page.getByText("Create your first project to get started"),
      ).toBeVisible();
    }

    // Verify create project card is always visible
    await expect(page.getByTestId("create-project-card")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Open modal
    await page.getByTestId("create-project-card").click();

    // Verify submit button is disabled with empty name
    await expect(page.getByTestId("project-submit-button")).toBeDisabled();

    // Type name then clear it
    await page.getByTestId("project-name-input").fill("Test");
    await page.getByTestId("project-name-input").clear();

    // Verify button is still disabled
    await expect(page.getByTestId("project-submit-button")).toBeDisabled();

    // Fill with whitespace only
    await page.getByTestId("project-name-input").fill("   ");

    // Button should still be disabled (trimmed name is empty)
    await expect(page.getByTestId("project-submit-button")).toBeDisabled();
  });
});
