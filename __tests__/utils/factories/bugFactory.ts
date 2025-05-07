import { Bug, BugPriority, BugStatus } from "../../../types";

export const createBug = (overrides?: Partial<Bug>): Bug => ({
  id: `bug-${Math.random().toString(36).substr(2, 9)}`,
  title: "Test Bug",
  description: "This is a test bug description",
  status: BugStatus.OPEN,
  priority: BugPriority.MEDIUM,
  assignedTo: "user-123",
  createdBy: "user-456",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  projectId: "project-123",
  tags: ["test"],
  attachments: [],
  comments: [],
  ...overrides,
});

export const createBugList = (
  count: number,
  overrides?: Partial<Bug>
): Bug[] => {
  return Array.from({ length: count }, () => createBug(overrides));
};
