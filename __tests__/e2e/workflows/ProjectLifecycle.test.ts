import { test, expect } from "@playwright/test";
import { mockUser, mockProject } from "../../utils/test-utils";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

test.describe("Project Lifecycle", () => {
  let userId: string;
  let projectId: number;

  test.beforeEach(async ({ page }) => {
    // Create test user
    const hashedPassword = await hashPassword("Password123!");
    const user = await prisma.user.create({
      data: {
        ...mockUser,
        password: hashedPassword,
      },
    });
    userId = user.id;

    // Login
    await page.goto("/login");
    await page.fill('[name="email"]', mockUser.email);
    await page.fill('[name="password"]', "Password123!");
    await page.click('button:text("Sign In")');
    await page.waitForURL("/dashboard");
  });

  test.afterEach(async () => {
    // Cleanup
    await prisma.bug.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  test("complete project lifecycle workflow", async ({ page }) => {
    // Create new project
    await test.step("Create Project", async () => {
      await page.click('button:text("Create Project")');
      await page.fill('[name="name"]', "E2E Test Project");
      await page.fill('[name="description"]', "Project for E2E testing");
      await page.selectOption('[name="visibility"]', "PUBLIC");
      await page.click('button:text("Create")');

      const projectUrl = page.url();
      projectId = parseInt(projectUrl.split("/").pop() || "0");
      expect(projectId).toBeGreaterThan(0);
    });

    // Add team member
    await test.step("Add Team Member", async () => {
      await page.click('button:text("Add Member")');
      await page.fill('[name="email"]', "member@example.com");
      await page.click('button:text("Invite")');

      await expect(page.getByText("Invitation sent")).toBeVisible();
    });

    // Create bug
    await test.step("Create Bug", async () => {
      await page.click('button:text("Create Bug")');
      await page.fill('[name="title"]', "First Bug");
      await page.fill('[name="description"]', "This is a test bug");
      await page.selectOption('[name="priority"]', "HIGH");
      await page.selectOption('[name="severity"]', "MEDIUM");
      await page.click('button:text("Submit")');

      await expect(page.getByText("First Bug")).toBeVisible();
    });

    // Update bug status
    await test.step("Update Bug Status", async () => {
      await page.click('text="First Bug"');
      await page.selectOption('[name="status"]', "IN_PROGRESS");
      await expect(page.getByText("IN_PROGRESS")).toBeVisible();
    });

    // Add comment
    await test.step("Add Comment", async () => {
      const comment = "Working on this bug";
      await page.fill('[name="comment"]', comment);
      await page.click('button:text("Add Comment")');
      await expect(page.getByText(comment)).toBeVisible();
    });

    // Update project settings
    await test.step("Update Project Settings", async () => {
      await page.click('text="Settings"');
      await page.fill('[name="name"]', "Updated E2E Project");
      await page.click('button:text("Save Changes")');

      await expect(page.getByText("Updated E2E Project")).toBeVisible();
    });

    // View project activity
    await test.step("Check Project Activity", async () => {
      await page.click('text="Activity"');
      await expect(page.getByText("created the project")).toBeVisible();
      await expect(page.getByText("added a new bug")).toBeVisible();
      await expect(page.getByText("updated project settings")).toBeVisible();
    });

    // Generate project report
    await test.step("Generate Report", async () => {
      await page.click('text="Reports"');
      await page.click('button:text("Generate Report")');

      await expect(page.getByText("Bug Statistics")).toBeVisible();
      await expect(page.getByText("1 total bugs")).toBeVisible();
      await expect(page.getByText("1 in progress")).toBeVisible();
    });

    // Archive project
    await test.step("Archive Project", async () => {
      await page.click('text="Settings"');
      await page.click('button:text("Archive Project")');
      await page.click('button:text("Confirm")');

      await page.goto("/projects");
      await expect(page.getByText("E2E Test Project")).not.toBeVisible();
      await page.click('text="Archived"');
      await expect(page.getByText("E2E Test Project")).toBeVisible();
    });
  });

  test("project collaboration workflow", async ({ page, browser }) => {
    // Create project first
    await page.click('button:text("Create Project")');
    await page.fill('[name="name"]', "Collaboration Project");
    await page.fill('[name="description"]', "Testing collaboration features");
    await page.click('button:text("Create")');

    const projectUrl = page.url();
    projectId = parseInt(projectUrl.split("/").pop() || "0");

    // Create and invite a team member
    const memberPassword = "MemberPass123!";
    const memberUser = await prisma.user.create({
      data: {
        name: "Team Member",
        email: "member@example.com",
        password: await hashPassword(memberPassword),
      },
    });

    await page.click('button:text("Add Member")');
    await page.fill('[name="email"]', memberUser.email);
    await page.selectOption('[name="role"]', "DEVELOPER");
    await page.click('button:text("Invite")');

    // Login as team member in a new context
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();

    await memberPage.goto("/login");
    await memberPage.fill('[name="email"]', memberUser.email);
    await memberPage.fill('[name="password"]', memberPassword);
    await memberPage.click('button:text("Sign In")');
    await memberPage.waitForURL("/dashboard");

    // Member creates a bug
    await memberPage.goto(projectUrl);
    await memberPage.click('button:text("Create Bug")');
    await memberPage.fill('[name="title"]', "Member Bug");
    await memberPage.fill('[name="description"]', "Bug created by team member");
    await memberPage.click('button:text("Submit")');

    // Original user assigns bug to member
    await page.reload();
    await page.click('text="Member Bug"');
    await page.selectOption('[name="assignee"]', memberUser.id);

    // Member updates bug status
    await memberPage.reload();
    await memberPage.click('text="Member Bug"');
    await memberPage.selectOption('[name="status"]', "IN_PROGRESS");
    await memberPage.fill('[name="comment"]', "Started working on this");
    await memberPage.click('button:text("Add Comment")');

    // Verify notifications
    await page.click('text="Notifications"');
    await expect(page.getByText("updated bug status")).toBeVisible();
    await expect(page.getByText("added a comment")).toBeVisible();

    // Cleanup
    await memberContext.close();
    await prisma.user.delete({ where: { id: memberUser.id } });
  });
});
