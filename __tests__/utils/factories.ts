import { faker } from "@faker-js/faker";
import { User, Project, Bug, Comment } from "@prisma/client";

// Default mock user for tests
export const mockUser = {
  id: "test-user-id",
  name: "Test User",
  email: "test@example.com",
  password: "hashed_password",
  createdAt: new Date(),
  updatedAt: new Date(),
  role: "USER",
} as const;

// User factory
export const createMockUser = (
  overrides = {}
): Omit<User, "emailVerified"> => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  role: "USER",
  ...overrides,
});

// Project factory
export const createMockProject = (overrides = {}): Omit<Project, "id"> => ({
  name: faker.company.name(),
  description: faker.company.catchPhrase(),
  visibility: "PUBLIC",
  ownerId: faker.string.uuid(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Bug factory
export const createMockBug = (overrides = {}): Omit<Bug, "id"> => ({
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  status: "OPEN",
  priority: "MEDIUM",
  severity: "MEDIUM",
  reporterId: faker.string.uuid(),
  projectId: faker.number.int(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Comment factory
export const createMockComment = (overrides = {}): Omit<Comment, "id"> => ({
  content: faker.lorem.paragraph(),
  authorId: faker.string.uuid(),
  bugId: faker.number.int(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Create multiple records
export const createMockUsers = (count: number, overrides = {}) =>
  Array.from({ length: count }, () => createMockUser(overrides));

export const createMockProjects = (count: number, overrides = {}) =>
  Array.from({ length: count }, () => createMockProject(overrides));

export const createMockBugs = (count: number, overrides = {}) =>
  Array.from({ length: count }, () => createMockBug(overrides));

export const createMockComments = (count: number, overrides = {}) =>
  Array.from({ length: count }, () => createMockComment(overrides));

// Create related records
export const createMockProjectWithBugs = (bugCount = 3, overrides = {}) => {
  const project = createMockProject(overrides);
  const bugs = createMockBugs(bugCount, { projectId: project.id });
  return { project, bugs };
};

export const createMockBugWithComments = (commentCount = 3, overrides = {}) => {
  const bug = createMockBug(overrides);
  const comments = createMockComments(commentCount, { bugId: bug.id });
  return { bug, comments };
};

// Create test data with relationships
export const createTestData = () => {
  const owner = createMockUser();
  const project = createMockProject({ ownerId: owner.id });
  const members = createMockUsers(3);
  const bugs = createMockBugs(5, { projectId: project.id });
  const comments = bugs.flatMap((bug) =>
    createMockComments(2, { bugId: bug.id, authorId: members[0].id })
  );

  return {
    owner,
    project,
    members,
    bugs,
    comments,
  };
};
