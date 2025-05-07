import { test, expect } from "@playwright/test";
import { createUser } from "../../utils/factories/userFactory";
import { BugPriority, BugStatus } from "../../../types/bug";

test.describe("Bug Lifecycle E2E", () => {
  const testUser = createUser({ role: "ADMIN" });
  let bugId: string;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/auth/login");
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');
    await page.waitForURL("/dashboard");
  });

  test("complete bug lifecycle workflow", async ({ page }) => {
    // 1. Create new bug
    await test.step("Create bug", async () => {
      await page.goto("/bugs/new");
      await page.fill('[data-testid="bug-title"]', "E2E Test Bug");
      await page.fill(
        '[data-testid="bug-description"]',
        "Testing end-to-end workflow"
      );
      await page.selectOption('[data-testid="bug-priority"]', BugPriority.HIGH);

      // Upload attachment
      await page.setInputFiles(
        '[data-testid="attachment-input"]',
        "test-files/sample.png"
      );

      await page.click('[data-testid="submit-bug"]');
      await page.waitForSelector('[data-testid="success-message"]');

      // Get the bug ID from the URL
      const url = page.url();
      bugId = url.split("/").pop()!;
    });

    // 2. View bug details
    await test.step("View bug details", async () => {
      await page.goto(`/bugs/${bugId}`);
      await expect(page.locator('[data-testid="bug-title"]')).toHaveText(
        "E2E Test Bug"
      );
      await expect(page.locator('[data-testid="bug-priority"]')).toHaveText(
        "HIGH"
      );
    });

    // 3. Update bug status
    await test.step("Update bug status", async () => {
      await page.click('[data-testid="change-status"]');
      await page.selectOption(
        '[data-testid="status-select"]',
        BugStatus.IN_PROGRESS
      );
      await page.click('[data-testid="update-status"]');
      await page.waitForSelector(
        `[data-testid="status-badge"]:has-text("${BugStatus.IN_PROGRESS}")`
      );
    });

    // 4. Add comment
    await test.step("Add comment", async () => {
      await page.fill(
        '[data-testid="comment-input"]',
        "Working on fixing this bug"
      );
      await page.click('[data-testid="submit-comment"]');
      await page.waitForSelector(
        '[data-testid="comment-text"]:has-text("Working on fixing this bug")'
      );
    });

    // 5. Assign bug
    await test.step("Assign bug", async () => {
      await page.click('[data-testid="assign-bug"]');
      await page.selectOption('[data-testid="assignee-select"]', testUser.id);
      await page.click('[data-testid="confirm-assign"]');
      await page.waitForSelector(
        `[data-testid="assignee-name"]:has-text("${testUser.name}")`
      );
    });

    // 6. Mark as resolved
    await test.step("Resolve bug", async () => {
      await page.click('[data-testid="change-status"]');
      await page.selectOption(
        '[data-testid="status-select"]',
        BugStatus.RESOLVED
      );
      await page.fill(
        '[data-testid="resolution-notes"]',
        "Fixed in latest commit"
      );
      await page.click('[data-testid="update-status"]');
      await page.waitForSelector(
        `[data-testid="status-badge"]:has-text("${BugStatus.RESOLVED}")`
      );
    });
  });

  test("handles validation and errors", async ({ page }) => {
    await page.goto("/bugs/new");

    // Try to submit without required fields
    await page.click('[data-testid="submit-bug"]');
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="description-error"]')
    ).toBeVisible();

    // Try to upload invalid file type
    await page.setInputFiles(
      '[data-testid="attachment-input"]',
      "test-files/invalid.exe"
    );
    await expect(
      page.locator('[data-testid="attachment-error"]')
    ).toBeVisible();

    // Test character limits
    const longTitle = "a".repeat(256);
    await page.fill('[data-testid="bug-title"]', longTitle);
    await expect(page.locator('[data-testid="title-error"]')).toHaveText(
      "Title must be less than 255 characters"
    );
  });

  test("performance and load testing", async ({ page }) => {
    // Create multiple bugs in succession
    for (let i = 0; i < 5; i++) {
      await page.goto("/bugs/new");
      await page.fill('[data-testid="bug-title"]', `Performance Test Bug ${i}`);
      await page.fill(
        '[data-testid="bug-description"]',
        "Testing system performance"
      );
      await page.selectOption(
        '[data-testid="bug-priority"]',
        BugPriority.MEDIUM
      );
      await page.click('[data-testid="submit-bug"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }

    // Verify list loads quickly
    const startTime = Date.now();
    await page.goto("/bugs");
    await page.waitForSelector('[data-testid="bug-list"]');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // Should load in less than 2 seconds
  });
});
