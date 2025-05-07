import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewBugPage from "@/app/dashboard/bugs/new/page";
import BugsPage from "@/app/dashboard/bugs/page";
import BugDetailPage from "@/app/dashboard/bugs/[id]/page";
import * as navigation from "next/navigation";
import "@testing-library/jest-dom";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock useToast
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("Bug Tracking System Integration", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockUsers = [
    { id: "user-1", name: "John Doe", email: "john@example.com" },
    { id: "user-2", name: "Jane Smith", email: "jane@example.com" },
  ];

  const mockProjects = [
    { id: "project-1", name: "Frontend App", description: "Frontend project" },
    { id: "project-2", name: "Backend API", description: "Backend project" },
  ];

  const mockCurrentUser = { user: { id: "user-1" } };

  const mockBug = {
    id: "bug-1",
    title: "Test Bug",
    description: "Test description",
    stepsToReproduce: "1. Do this\n2. Then that",
    status: "OPEN",
    priority: "HIGH",
    severity: "CRITICAL",
    assignee: null,
    reporter: { id: "user-1", name: "John Doe" },
    project: { id: "project-1", name: "Frontend App" },
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    comments: [],
    activities: [
      {
        id: "activity-1",
        action: "created bug",
        createdAt: "2023-01-01T00:00:00Z",
        user: { id: "user-1", name: "John Doe" },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    (navigation.useRouter as jest.Mock).mockImplementation(() => mockRouter);
  });

  it("creates a bug and displays it in the list and details page", async () => {
    mockFetch.mockImplementation((url, options) => {
      if (url.includes("/api/auth/session")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCurrentUser),
        });
      }
      if (url.includes("/api/projects")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects: mockProjects }),
        });
      }
      if (url.includes("/api/users")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      if (url.includes("/api/bugs") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bug: mockBug }),
        });
      }
      if (url.includes("/api/bugs?")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bugs: [mockBug] }),
        });
      }
      if (url.includes("/api/bugs/bug-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bug: mockBug }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const mockToast = jest.fn();
    jest.mock("@/components/ui/use-toast", () => ({
      useToast: () => ({
        toast: mockToast,
      }),
    }));

    // Step 1: Create a bug on NewBugPage
    render(<NewBugPage />);

    await waitFor(() => {
      // Debug DOM if elements are not found
      if (!screen.queryByLabelText("Bug Title")) {
        screen.debug();
      }
      expect(screen.getByLabelText("Bug Title")).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText("Bug Title"), {
        target: { value: "Test Bug" },
      });
      fireEvent.change(screen.getByLabelText("Description"), {
        target: { value: "Test description" },
      });
      fireEvent.change(screen.getByLabelText("Steps to Reproduce"), {
        target: { value: "1. Do this\n2. Then that" },
      });

      // Select project
      const projectSelect = screen.getByLabelText("Project");
      fireEvent.click(projectSelect);
      const projectOption = screen.getByText("Frontend App");
      fireEvent.click(projectOption);

      // Select severity
      const severitySelect = screen.getByLabelText("Severity");
      fireEvent.click(severitySelect);
      const severityOption = screen.getByText("Critical");
      fireEvent.click(severityOption);

      // Select priority
      const prioritySelect = screen.getByLabelText("Priority");
      fireEvent.click(prioritySelect);
      const priorityOption = screen.getByText("High");
      fireEvent.click(priorityOption);

      // Submit form
      const submitButton = screen.getByRole("button", { name: "Submit Bug Report" });
      fireEvent.click(submitButton);
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bugs",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      );
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Success",
          description: "Bug created successfully",
        })
      );
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/bugs/bug-1");
    });

    // Step 2: Verify bug appears in BugsPage
    render(<BugsPage />);

    await waitFor(() => {
      // Debug DOM if elements are not found
      if (!screen.queryByText("Test Bug")) {
        screen.debug();
      }
      expect(screen.getByText("Test Bug")).toBeInTheDocument();
      expect(screen.getByText("OPEN")).toBeInTheDocument();
      expect(screen.getByText("HIGH")).toBeInTheDocument();
      expect(screen.getByText("Frontend App")).toBeInTheDocument();
      expect(screen.getByText("bug-1")).toBeInTheDocument();
    }, { timeout: 2000 });

    // Step 3: Verify bug details in BugDetailPage
    render(<BugDetailPage params={Promise.resolve({ id: "bug-1" })} />);

    await waitFor(() => {
      // Debug DOM if elements are not found
      if (!screen.queryByText("Test Bug")) {
        screen.debug();
      }
      expect(screen.getByText("Test Bug")).toBeInTheDocument();
      expect(screen.getByText("bug-1")).toBeInTheDocument();
      expect(screen.getByText("OPEN")).toBeInTheDocument();
      expect(screen.getByText("HIGH")).toBeInTheDocument();
      expect(screen.getByText("CRITICAL")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
      expect(screen.getByText("1. Do this")).toBeInTheDocument();
      expect(screen.getByText(/Reported by John Doe/i)).toBeInTheDocument();
      expect(screen.getByText("Frontend App")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});