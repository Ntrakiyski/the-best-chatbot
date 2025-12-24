import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../constants/test-users";

/**
 * E2E Tests for Projects Feature - Phase 2: Milestone 2
 * Tests project lifecycle operations: archive, unarchive, and delete
 */

test.describe("Project Lifecycle Management", () => {
  test.use({ storageState: TEST_USERS.editor.authFile });

  let testProjectId: string;
  let testProjectName: string;

  test.beforeEach(async ({ page }) => {
    // Create a test project for lifecycle operations
    const timestamp = Date.now();
    testProjectName = `Lifecycle Test ${timestamp}`;

    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Create project
    await page.getByTestId("create-project-card").click();
    await page.getByTestId("project-name-input").fill(testProjectName);
    await page
      .getByTestId("project-description-input")
      .fill("Test project for lifecycle operations");
    await page.getByTestId("project-submit-button").click();

    // Wait for navigation and extract project ID
    await page.waitForURL("**/projects/**", { timeout: 10000 });
    const currentUrl = page.url();
    testProjectId = currentUrl.split("/projects/")[1];

    // Navigate back to projects list
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("should display Active and Archived tabs", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Verify tabs exist
    await expect(
      page.getByRole("tab", { name: /Active Projects/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Archived Projects/i }),
    ).toBeVisible();

    // Verify Active tab is selected by default
    await expect(
      page.getByRole("tab", { name: /Active Projects/i }),
    ).toHaveAttribute("data-state", "active");
  });

  test("should archive a project from dropdown menu", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Ensure we're on Active tab
    await page.getByRole("tab", { name: /Active Projects/i }).click();

    // Find the test project card
    const projectCard = page.getByTestId(`project-card-${testProjectId}`);
    await expect(projectCard).toBeVisible();

    // Open dropdown menu
    await page.getByTestId(`project-menu-${testProjectId}`).click();

    // Click archive option
    await page.getByTestId(`archive-${testProjectId}`).click();

    // Wait for success toast
    await expect(page.getByText("Project archived successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify project is removed from Active tab
    await expect(projectCard).not.toBeVisible();

    // Switch to Archived tab
    await page.getByRole("tab", { name: /Archived Projects/i }).click();
    await page.waitForTimeout(500);

    // Verify project appears in Archived tab
    const archivedCard = page.getByTestId(`project-card-${testProjectId}`);
    await expect(archivedCard).toBeVisible();

    // Verify archived badge is shown
    await expect(
      page.getByTestId(`archived-badge-${testProjectId}`),
    ).toBeVisible();
  });

  test("should unarchive a project from Archived tab", async ({ page }) => {
    // First, archive the project
    await page.goto("/projects");
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await page.getByTestId(`archive-${testProjectId}`).click();
    await page.waitForTimeout(1000);

    // Switch to Archived tab
    await page.getByRole("tab", { name: /Archived Projects/i }).click();
    await page.waitForTimeout(500);

    // Verify project is in archived tab
    const archivedCard = page.getByTestId(`project-card-${testProjectId}`);
    await expect(archivedCard).toBeVisible();

    // Open dropdown menu
    await page.getByTestId(`project-menu-${testProjectId}`).click();

    // Click unarchive option
    await page.getByTestId(`unarchive-${testProjectId}`).click();

    // Wait for success toast
    await expect(page.getByText("Project unarchived successfully")).toBeVisible(
      { timeout: 5000 },
    );

    // Verify project is removed from Archived tab
    await expect(archivedCard).not.toBeVisible();

    // Switch to Active tab
    await page.getByRole("tab", { name: /Active Projects/i }).click();
    await page.waitForTimeout(500);

    // Verify project appears in Active tab
    const activeCard = page.getByTestId(`project-card-${testProjectId}`);
    await expect(activeCard).toBeVisible();

    // Verify archived badge is NOT shown
    await expect(
      page.getByTestId(`archived-badge-${testProjectId}`),
    ).not.toBeVisible();
  });

  test("should show warning banner and disable editing for archived projects", async ({
    page,
  }) => {
    // Archive the project
    await page.goto("/projects");
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await page.getByTestId(`archive-${testProjectId}`).click();
    await page.waitForTimeout(1000);

    // Navigate to project detail page
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Verify archived badge is shown
    await expect(page.getByTestId("archived-badge")).toBeVisible();

    // Verify warning banner is displayed
    await expect(
      page.getByText(/Editing is disabled for archived projects/i),
    ).toBeVisible();

    // Verify edit project button is not visible
    await expect(page.getByTestId("edit-project-button")).not.toBeVisible();

    // Verify add version button is not visible
    await expect(page.getByTestId("add-version-button")).not.toBeVisible();

    // Find first version card
    const versionCard = page.locator('[data-testid^="version-card-"]').first();
    if ((await versionCard.count()) > 0) {
      // Verify version edit/delete buttons are not visible
      const editButtons = versionCard
        .locator("button")
        .filter({ has: page.locator("svg") });
      await expect(editButtons.first()).not.toBeVisible();

      // Verify "Add Deliverable" button is not visible
      await expect(versionCard.getByText("Add Deliverable")).not.toBeVisible();

      // Verify status dropdown is disabled
      const statusDropdown = versionCard
        .locator('button[role="combobox"]')
        .first();
      if ((await statusDropdown.count()) > 0) {
        await expect(statusDropdown).toBeDisabled();
      }
    }
  });

  test("should delete a project with confirmation", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Find the project card
    const projectCard = page.getByTestId(`project-card-${testProjectId}`);
    await expect(projectCard).toBeVisible();

    // Open dropdown menu
    await page.getByTestId(`project-menu-${testProjectId}`).click();

    // Click delete option
    await page.getByTestId(`delete-${testProjectId}`).click();

    // Verify confirmation dialog appears
    await expect(
      page.getByText(/Are you sure you want to delete/i),
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /confirm|delete|yes/i }).click();

    // Wait for success toast
    await expect(page.getByText("Project deleted successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify project is removed from list
    await expect(projectCard).not.toBeVisible();

    // Verify navigating to the deleted project shows "not found"
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Project not found")).toBeVisible();
  });

  test("should cancel delete operation when confirmation is declined", async ({
    page,
  }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Find the project card
    const projectCard = page.getByTestId(`project-card-${testProjectId}`);
    await expect(projectCard).toBeVisible();

    // Open dropdown menu
    await page.getByTestId(`project-menu-${testProjectId}`).click();

    // Click delete option
    await page.getByTestId(`delete-${testProjectId}`).click();

    // Verify confirmation dialog appears
    await expect(
      page.getByText(/Are you sure you want to delete/i),
    ).toBeVisible();

    // Cancel deletion
    await page.getByRole("button", { name: /cancel|no/i }).click();

    // Verify project is still visible
    await expect(projectCard).toBeVisible();
  });

  test("should delete archived projects", async ({ page }) => {
    // First, archive the project
    await page.goto("/projects");
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await page.getByTestId(`archive-${testProjectId}`).click();
    await page.waitForTimeout(1000);

    // Switch to Archived tab
    await page.getByRole("tab", { name: /Archived Projects/i }).click();
    await page.waitForTimeout(500);

    // Verify project is in archived tab
    const archivedCard = page.getByTestId(`project-card-${testProjectId}`);
    await expect(archivedCard).toBeVisible();

    // Open dropdown menu and delete
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await page.getByTestId(`delete-${testProjectId}`).click();

    // Confirm deletion
    await page.getByRole("button", { name: /confirm|delete|yes/i }).click();

    // Wait for success toast
    await expect(page.getByText("Project deleted successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify project is removed
    await expect(archivedCard).not.toBeVisible();
  });

  test("should show empty state in Archived tab when no archived projects", async ({
    page,
  }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Switch to Archived tab
    await page.getByRole("tab", { name: /Archived Projects/i }).click();
    await page.waitForTimeout(500);

    // Check if there are any archived projects
    const archivedCards = page.locator('[data-testid^="project-card-"]');
    const count = await archivedCards.count();

    if (count === 0) {
      // Verify empty state is shown
      await expect(page.getByText("No archived projects")).toBeVisible();
    }

    // Verify "Create Project" card is NOT shown in Archived tab
    await expect(page.getByTestId("create-project-card")).not.toBeVisible();
  });

  test("should maintain tab state when switching between tabs", async ({
    page,
  }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Verify Active tab is selected initially
    await expect(
      page.getByRole("tab", { name: /Active Projects/i }),
    ).toHaveAttribute("data-state", "active");

    // Switch to Archived tab
    await page.getByRole("tab", { name: /Archived Projects/i }).click();

    // Verify Archived tab is now active
    await expect(
      page.getByRole("tab", { name: /Archived Projects/i }),
    ).toHaveAttribute("data-state", "active");

    // Switch back to Active tab
    await page.getByRole("tab", { name: /Active Projects/i }).click();

    // Verify Active tab is active again
    await expect(
      page.getByRole("tab", { name: /Active Projects/i }),
    ).toHaveAttribute("data-state", "active");
  });

  test("should show correct dropdown options for active vs archived projects", async ({
    page,
  }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Check dropdown options for active project
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await expect(page.getByTestId(`archive-${testProjectId}`)).toBeVisible();
    await expect(page.getByText("Archive Project")).toBeVisible();
    await expect(page.getByText("Delete Project")).toBeVisible();

    // Close dropdown
    await page.keyboard.press("Escape");

    // Archive the project
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await page.getByTestId(`archive-${testProjectId}`).click();
    await page.waitForTimeout(1000);

    // Switch to Archived tab
    await page.getByRole("tab", { name: /Archived Projects/i }).click();
    await page.waitForTimeout(500);

    // Check dropdown options for archived project
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await expect(page.getByTestId(`unarchive-${testProjectId}`)).toBeVisible();
    await expect(page.getByText("Unarchive Project")).toBeVisible();
    await expect(page.getByText("Delete Project")).toBeVisible();

    // Verify "Archive Project" is NOT shown
    await expect(page.getByText("Archive Project")).not.toBeVisible();
  });

  test("should handle rapid archive/unarchive operations", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Archive
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await page.getByTestId(`archive-${testProjectId}`).click();
    await page.waitForTimeout(500);

    // Switch to archived tab
    await page.getByRole("tab", { name: /Archived Projects/i }).click();
    await page.waitForTimeout(500);

    // Unarchive
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await page.getByTestId(`unarchive-${testProjectId}`).click();
    await page.waitForTimeout(500);

    // Switch back to active tab
    await page.getByRole("tab", { name: /Active Projects/i }).click();
    await page.waitForTimeout(500);

    // Archive again
    await page.getByTestId(`project-menu-${testProjectId}`).click();
    await page.getByTestId(`archive-${testProjectId}`).click();
    await page.waitForTimeout(500);

    // Verify project ends up in archived state
    await page.getByRole("tab", { name: /Archived Projects/i }).click();
    await page.waitForTimeout(500);
    await expect(
      page.getByTestId(`project-card-${testProjectId}`),
    ).toBeVisible();
  });
});
