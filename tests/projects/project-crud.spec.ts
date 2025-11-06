import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../constants/test-users";

/**
 * E2E Tests for Projects Feature - Phase 2: Milestone 2
 * Tests CRUD operations for projects, versions, and deliverables
 */

test.describe("Project CRUD Operations", () => {
  test.use({ storageState: TEST_USERS.editor.authFile });

  let testProjectId: string;
  let testVersionId: string;
  let testDeliverableId: string;

  test.beforeEach(async ({ page }) => {
    // Create a test project for CRUD operations
    const timestamp = Date.now();
    const projectName = `CRUD Test Project ${timestamp}`;

    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Create project
    await page.getByTestId("create-project-card").click();
    await page.getByTestId("project-name-input").fill(projectName);
    await page
      .getByTestId("project-description-input")
      .fill("Test project for CRUD operations");
    await page.getByTestId("project-submit-button").click();

    // Wait for navigation and extract project ID
    await page.waitForURL("**/projects/**", { timeout: 10000 });
    const currentUrl = page.url();
    testProjectId = currentUrl.split("/projects/")[1];
  });

  test("should edit project metadata (name and description)", async ({
    page,
  }) => {
    // Navigate to project detail page
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Click edit button
    await page.getByTestId("edit-project-button").click();

    // Verify form appears
    await expect(page.locator("#project-name")).toBeVisible();
    await expect(page.locator("#project-description")).toBeVisible();

    // Update project name and description
    const updatedName = `Updated Project ${Date.now()}`;
    const updatedDescription = "This is an updated description";

    await page.locator("#project-name").clear();
    await page.locator("#project-name").fill(updatedName);
    await page.locator("#project-description").clear();
    await page.locator("#project-description").fill(updatedDescription);

    // Save changes
    await page.getByTestId("save-project-button").click();

    // Wait for toast notification
    await expect(page.getByText("Project updated successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify changes are reflected
    await expect(page.getByTestId("project-name")).toContainText(updatedName);
    await expect(page.getByTestId("project-description")).toContainText(
      updatedDescription,
    );
  });

  test("should create a new version", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Click add version button
    await page.getByTestId("add-version-button").click();

    // Verify form appears
    await expect(page.locator("#version-name")).toBeVisible();
    await expect(page.locator("#version-description")).toBeVisible();

    // Fill version details
    const versionName = `V2.0 - ${Date.now()}`;
    const versionDescription = "Second version of the project";

    await page.locator("#version-name").fill(versionName);
    await page.locator("#version-description").fill(versionDescription);

    // Submit form
    await page.getByText("Create Version").click();

    // Wait for success toast
    await expect(page.getByText("Version created successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify version appears in the list
    const versionCard = page
      .locator('[data-testid^="version-card-"]')
      .filter({ hasText: versionName });
    await expect(versionCard).toBeVisible();
  });

  test("should edit an existing version", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Find the first version (V1) and click edit
    const firstVersion = page.locator('[data-testid^="version-card-"]').first();
    await expect(firstVersion).toBeVisible();

    // Click edit button (ghost button with Edit2 icon)
    const editButton = firstVersion
      .locator('button[class*="ghost"]')
      .filter({ has: page.locator('svg') })
      .first();
    await editButton.click();

    // Verify edit form appears
    await expect(firstVersion.locator('input[value*="V1"]')).toBeVisible();

    // Update version name
    const updatedVersionName = `V1.1 - ${Date.now()}`;
    await firstVersion.locator("input").first().clear();
    await firstVersion.locator("input").first().fill(updatedVersionName);

    // Update description
    const updatedDescription = "Updated version description";
    await firstVersion.locator("textarea").fill(updatedDescription);

    // Save changes
    await firstVersion.getByText("Save").click();

    // Wait for success toast
    await expect(page.getByText("Version updated successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify changes are reflected
    await expect(firstVersion).toContainText(updatedVersionName);
    await expect(firstVersion).toContainText(updatedDescription);
  });

  test("should delete a version with confirmation", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Create a new version to delete
    await page.getByTestId("add-version-button").click();
    const versionToDelete = `Delete Me ${Date.now()}`;
    await page.locator("#version-name").fill(versionToDelete);
    await page.getByText("Create Version").click();
    await page.waitForTimeout(1000);

    // Find the version card
    const versionCard = page
      .locator('[data-testid^="version-card-"]')
      .filter({ hasText: versionToDelete });
    await expect(versionCard).toBeVisible();

    // Click delete button (trash icon)
    const deleteButton = versionCard
      .locator('button[class*="destructive"]')
      .or(versionCard.locator('button').filter({ has: page.locator('svg') }))
      .last();
    await deleteButton.click();

    // Verify confirmation dialog appears
    await expect(page.getByText("Delete Version?")).toBeVisible();
    await expect(
      page.getByText(/Are you sure you want to delete/),
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /confirm|delete|yes/i }).click();

    // Wait for success toast
    await expect(page.getByText("Version deleted successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify version is removed
    await expect(versionCard).not.toBeVisible();
  });

  test("should create a deliverable in a version", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Find first version card
    const versionCard = page.locator('[data-testid^="version-card-"]').first();
    await expect(versionCard).toBeVisible();

    // Click "Add Deliverable" button
    await versionCard.getByText("Add Deliverable").click();

    // Verify form appears
    await expect(versionCard.getByText("Deliverable Name")).toBeVisible();

    // Fill deliverable details
    const deliverableName = `Test Deliverable ${Date.now()}`;
    const deliverableDescription = "This is a test deliverable";

    await versionCard.locator('input[type="text"]').last().fill(deliverableName);
    await versionCard.locator("textarea").last().fill(deliverableDescription);

    // Submit form
    await versionCard.getByRole("button", { name: "Create" }).click();

    // Wait for success toast
    await expect(
      page.getByText("Deliverable created successfully"),
    ).toBeVisible({ timeout: 5000 });

    // Verify deliverable appears
    const deliverable = versionCard
      .locator('[data-testid^="deliverable-"]')
      .filter({ hasText: deliverableName });
    await expect(deliverable).toBeVisible();
  });

  test("should update deliverable status via dropdown", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Find first version with deliverables
    const versionCard = page.locator('[data-testid^="version-card-"]').first();
    const firstDeliverable = versionCard
      .locator('[data-testid^="deliverable-"]')
      .first();
    await expect(firstDeliverable).toBeVisible();

    // Click status dropdown
    const statusDropdown = firstDeliverable
      .locator('button[role="combobox"]')
      .first();
    await statusDropdown.click();

    // Select "In Progress"
    await page.getByRole("option", { name: /In Progress/i }).click();

    // Wait for success toast
    await expect(page.getByText("Status updated successfully")).toBeVisible({
      timeout: 5000,
    });

    // Verify status is updated (dropdown should show In Progress)
    await expect(statusDropdown).toContainText("In Progress");
  });

  test("should edit a deliverable", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Find first deliverable
    const versionCard = page.locator('[data-testid^="version-card-"]').first();
    const firstDeliverable = versionCard
      .locator('[data-testid^="deliverable-"]')
      .first();
    await expect(firstDeliverable).toBeVisible();

    // Click edit button (Edit2 icon)
    const editButton = firstDeliverable
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await editButton.click();

    // Verify edit form appears
    await expect(firstDeliverable.getByText("Name")).toBeVisible();

    // Update deliverable
    const updatedName = `Updated Deliverable ${Date.now()}`;
    await firstDeliverable.locator('input[type="text"]').first().clear();
    await firstDeliverable.locator('input[type="text"]').first().fill(updatedName);

    // Save changes
    await firstDeliverable.getByRole("button", { name: "Save" }).click();

    // Wait for success toast
    await expect(
      page.getByText("Deliverable updated successfully"),
    ).toBeVisible({ timeout: 5000 });

    // Verify changes
    await expect(firstDeliverable).toContainText(updatedName);
  });

  test("should delete a deliverable with confirmation", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Create a deliverable to delete
    const versionCard = page.locator('[data-testid^="version-card-"]').first();
    await versionCard.getByText("Add Deliverable").click();
    const deliverableToDelete = `Delete Me ${Date.now()}`;
    await versionCard.locator('input[type="text"]').last().fill(deliverableToDelete);
    await versionCard.getByRole("button", { name: "Create" }).click();
    await page.waitForTimeout(1000);

    // Find the deliverable
    const deliverable = versionCard
      .locator('[data-testid^="deliverable-"]')
      .filter({ hasText: deliverableToDelete });
    await expect(deliverable).toBeVisible();

    // Click delete button (trash icon)
    const deleteButton = deliverable
      .locator('button')
      .filter({ has: page.locator('svg') })
      .last();
    await deleteButton.click();

    // Verify confirmation dialog
    await expect(page.getByText("Delete Deliverable?")).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /confirm|delete|yes/i }).click();

    // Wait for success toast
    await expect(
      page.getByText("Deliverable deleted successfully"),
    ).toBeVisible({ timeout: 5000 });

    // Verify deliverable is removed
    await expect(deliverable).not.toBeVisible();
  });

  test("should cancel edit operations without saving", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    const originalName = await page.getByTestId("project-name").textContent();

    // Start editing project
    await page.getByTestId("edit-project-button").click();
    await page.locator("#project-name").fill("This should not be saved");

    // Cancel edit
    await page.getByRole("button", { name: "Cancel" }).first().click();

    // Verify original name is still shown
    await expect(page.getByTestId("project-name")).toContainText(
      originalName || "",
    );
  });

  test("should handle validation errors gracefully", async ({ page }) => {
    await page.goto(`/projects/${testProjectId}`);
    await page.waitForLoadState("networkidle");

    // Try to create version with empty name
    await page.getByTestId("add-version-button").click();
    await page.locator("#version-name").fill("   "); // Whitespace only
    await page.getByText("Create Version").click();

    // Verify validation error
    await expect(page.getByText(/required|cannot be empty/i)).toBeVisible({
      timeout: 5000,
    });
  });
});

