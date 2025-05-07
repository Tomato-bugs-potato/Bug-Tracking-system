import { Page } from "@playwright/test";
import { prisma } from "@/lib/prisma";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

export async function login(page: Page) {
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button:text("Sign In")');
  await page.waitForURL("/dashboard");
}

export async function createTestUser() {
  return await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      password: "hashedPassword123",
    },
  });
}

export async function createTestProject(userId: string) {
  return await prisma.project.create({
    data: {
      name: "Test Project",
      description: "A test project",
      members: {
        create: {
          userId: userId,
          role: "OWNER",
        },
      },
    },
  });
}

export async function createTestBug(projectId: string, userId: string) {
  return await prisma.bug.create({
    data: {
      title: "Test Bug",
      description: "A test bug",
      status: "OPEN",
      priority: "HIGH",
      projectId,
      reporterId: userId,
    },
  });
}

export async function cleanupTestData() {
  await prisma.bug.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

export const mockUser = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  image: null,
};

export const mockSession = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockBug = {
  id: 1,
  title: "Test Bug",
  description: "Test description",
  status: "OPEN",
  priority: "HIGH",
  severity: "MEDIUM",
  projectId: 1,
  assigneeId: "1",
  reporterId: "1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockProject = {
  id: 1,
  name: "Test Project",
  description: "Test project description",
  status: "ACTIVE",
  ownerId: "1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: {
    bugs: 5,
    members: 3,
  },
};

export const mockComment = {
  id: 1,
  content: "Test comment",
  bugId: 1,
  userId: "1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  user: mockUser,
};

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    ...options,
  });
}

export function createMockApiResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

export function fillFormFields(fields: Record<string, string>) {
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.querySelector(
      `[name="${name}"]`
    ) as HTMLInputElement;
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

export function createMockFile(name: string, type: string, size: number) {
  return new File(["test"], name, { type });
}

export function getRelativeDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export class ApiError extends Error {
  constructor(message: string, public status: number = 400, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export function generateMockBugs(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `bug-${i + 1}`,
    title: `Test Bug ${i + 1}`,
    description: `Description for test bug ${i + 1}`,
    status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"][
      Math.floor(Math.random() * 4)
    ],
    priority: ["HIGH", "MEDIUM", "LOW"][Math.floor(Math.random() * 3)],
    severity: ["CRITICAL", "MAJOR", "MINOR", "TRIVIAL"][
      Math.floor(Math.random() * 4)
    ],
    assignee: {
      id: `user-${i + 1}`,
      name: `Test User ${i + 1}`,
    },
    reporter: {
      id: "reporter-1",
      name: "Test Reporter",
    },
    project: {
      id: "project-1",
      name: "Test Project",
    },
    createdAt: new Date(Date.now() - Math.random() * 10000000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 1000000).toISOString(),
    source: Math.random() > 0.5 ? "JIRA" : "GITHUB",
  }));
}

export function generateMockProjects(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...mockProject,
    id: i + 1,
    name: `Project ${i + 1}`,
  }));
}

export function generateMockComments(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...mockComment,
    id: i + 1,
    content: `Comment ${i + 1}`,
  }));
}

export function mockFetchResponse(data: any, options = {}) {
  global.fetch = jest.fn().mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
      ...options,
    })
  );
}

export function getTestId(...parts: string[]) {
  return parts.join("-");
}
