// __test__/unit/bug/NewBugPage.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewBugPage from "@/app/dashboard/bugs/new/page";
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

describe("NewBugPage", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks();
    (navigation.useRouter as jest.Mock).mockImplementation(() => mockRouter);
    mockFetch.mockClear();
  });

  it("renders loading state initially", () => {
    render(<NewBugPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows login prompt when not authenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: null }),
    });

    render(<NewBugPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/You must be logged in to create a bug/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Go to Login/i)).toBeInTheDocument();
    });
  });

  it("renders form when authenticated", async () => {
    mockFetch.mockImplementation((url) => {
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
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<NewBugPage />);

    await waitFor(() => {
      expect(screen.getByText("Report New Bug")).toBeInTheDocument();
      expect(screen.getByText("Bug Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("Steps to Reproduce")).toBeInTheDocument();
    });
  });

  it("submits the form successfully", async () => {
    mockFetch.mockImplementation((url) => {
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
      if (url.includes("/api/bugs")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bug: { id: "new-bug-1" } }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<NewBugPage />);

    await waitFor(() => {
      fireEvent.change(screen.getAllByLabelText("Bug Title")[0], {
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
      const submitButton = screen.getByText("Submit Bug Report");
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bugs",
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/bugs/new-bug-1");
    });
  });

  // it("shows error when form submission fails", async () => {
  //   mockFetch.mockImplementation((url) => {
  //     if (url.includes("/api/auth/session")) {
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve(mockCurrentUser),
  //       });
  //     }
  //     if (url.includes("/api/projects")) {
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve({ projects: mockProjects }),
  //       });
  //     }
  //     if (url.includes("/api/users")) {
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve({ users: mockUsers }),
  //       });
  //     }
  //     if (url.includes("/api/bugs")) {
  //       return Promise.reject(new Error("Failed to create bug"));
  //     }
  //     return Promise.reject(new Error("Unknown URL"));
  //   });

  //   render(<NewBugPage />);

  //   await waitFor(() => {
  //     fireEvent.change(screen.getByLabelText("Bug Title"), {
  //       target: { value: "Test Bug" },
  //     });
  //     fireEvent.change(screen.getByLabelText("Description"), {
  //       target: { value: "Test description" },
  //     });

  //     const submitButton = screen.getByText("Submit Bug Report");
  //     fireEvent.click(submitButton);
  //   });

  //   await waitFor(() => {
  //     expect(screen.getByText("Failed to create bug")).toBeInTheDocument();
  //   });
  // });

  it("handles file attachments", async () => {
    mockFetch.mockImplementation((url) => {
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
      return Promise.reject(new Error("Unknown URL"));
    });

    // Create a mock file
    const file = new File(["test"], "test.png", { type: "image/png" });

    render(<NewBugPage />);

    await waitFor(() => {
      const fileInput = screen.getByLabelText("Attachments");
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    });

    await waitFor(() => {
      expect(screen.getByText("test.png")).toBeInTheDocument();
    });
  });
});
