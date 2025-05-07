import { User, UserRole } from "../../../types/user";

export const createUser = (overrides?: Partial<User>): User => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: `test-${Math.random().toString(36).substr(2, 5)}@example.com`,
  name: "Test User",
  role: UserRole.DEVELOPER,
  avatar: "https://via.placeholder.com/150",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  projects: [],
  assignedBugs: [],
  ...overrides,
});

export const createUserList = (
  count: number,
  overrides?: Partial<User>
): User[] => {
  return Array.from({ length: count }, () => createUser(overrides));
};
