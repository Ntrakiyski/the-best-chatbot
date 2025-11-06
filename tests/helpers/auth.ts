import type { Page } from "@playwright/test";
import { TEST_USERS } from "../constants/test-users";

/**
 * Login as a test user via the UI
 * @param page - Playwright Page object
 * @param credentials - Optional credentials to login with (defaults to admin user)
 */
export async function loginAsTestUser(
  page: Page,
  credentials?: { email: string; password: string },
) {
  const { email, password } = credentials || TEST_USERS.admin;

  await page.goto("/sign-in");

  // Fill in credentials
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  // Wait for redirect after successful login
  await page.waitForURL(
    (url) => {
      const urlStr = url.toString();
      return !urlStr.includes("/sign-in") && !urlStr.includes("/sign-up");
    },
    { timeout: 10000 },
  );
}
