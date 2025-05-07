// __tests__/unit/bugs/BugDetails.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BugDetailPage from "@/app/dashboard/bugs/[id]/page";
import * as navigation from "next/navigation";
import '@testing-library/jest-dom';
import { useToast } from "@/components/ui/use-toast";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock useToast
jest.mock("@/components/ui/use-toast", () => ({
  useToast: jest.fn(() => ({ toast: jest.fn() })),
}));

// Mock the use hook
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  use: jest.fn().mockImplementation((promise) => {
    if (promise === Promise.resolve({ id: "bug-1" })) {
      return { id: "bug-1" };
    }
    return promise;
  }),
}));

describe("BugDetailPage - Essential Features", () => {
  const mockBug = {
    id: "bug-1",
    title: "Login page not loading",
    description: "The login page fails to load",
    status: "OPEN",
    priority: "HIGH",
    reporter: { id: "user-1", name: "John Doe" },
    project: { id: "project-1", name: "Frontend App" },
    comments: [],
    activities: [],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-02T00:00:00Z"
  };

  const mockUsers = [
    { id: "user-1", name: "John Doe" },
    { id: "user-2", name: "Jane Smith" }
  ];

  const mockCurrentUser = { id: "user-1" };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useParams
    (navigation.useParams as jest.Mock).mockReturnValue({ id: "bug-1" });
    
    // Mock useRouter
    (navigation.useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });

    // Default mock implementation
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/bugs/bug-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bug: mockBug }),
        });
      }
      if (url.includes("/api/users")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      if (url.includes("/api/auth/session")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockCurrentUser }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  // Helper function to find text that might be split across elements
  const findTextContent = (text: string) => {
    return screen.getByText((content, element) => {
      const hasText = (node: Element | null) => node?.textContent?.includes(text);
      const elementHasText = hasText(element);
      const childrenDontHaveText = Array.from(element?.children || []).every(
        child => !hasText(child)
      );
      return elementHasText && childrenDontHaveText;
    });
  };

  it("renders loading state initially", async () => {
    render(<BugDetailPage params={Promise.resolve({ id: "bug-1" })} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it("displays bug details after loading", async () => {
    render(<BugDetailPage params={Promise.resolve({ id: "bug-1" })} />);

    await waitFor(() => {
      const titleElement = findTextContent("Login page not loading");
      expect(titleElement).toBeInTheDocument();
      expect(screen.getByText(/fails to load/i)).toBeInTheDocument();
    });
  });

  it("allows adding a new comment", async () => {
    render(<BugDetailPage params={Promise.resolve({ id: "bug-1" })} />);

    await waitFor(() => {
      findTextContent("Login page not loading");
    });

    // Switch to comments tab
    fireEvent.click(screen.getByRole("tab", { name: /comments/i }));

    // Type a new comment
    const commentInput = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(commentInput, { target: { value: "Test comment" } });

    // Mock the comment POST response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        comment: {
          id: "comment-1",
          content: "Test comment",
          createdAt: new Date().toISOString(),
          user: mockCurrentUser,
        },
      }),
    });

    // Submit the comment
    fireEvent.click(screen.getByRole("button", { name: /add comment/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/comments",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            content: "Test comment",
            bugId: "bug-1",
            userId: "user-1",
          }),
        })
      );
      expect(screen.getByText("Test comment")).toBeInTheDocument();
    });
  });

  it("handles status change from OPEN to IN_PROGRESS", async () => {
    render(<BugDetailPage params={Promise.resolve({ id: "bug-1" })} />);

    await waitFor(() => {
      findTextContent("Login page not loading");
    });

    // Mock the status PATCH response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        bug: { ...mockBug, status: "IN_PROGRESS" },
        activity: {
          id: "activity-1",
          action: "changed status to IN_PROGRESS",
          createdAt: new Date().toISOString(),
          user: mockCurrentUser,
        },
      }),
    });

    // Find and interact with status dropdown
    const statusSelect = screen.getByRole("combobox", { name: /status/i });
    fireEvent.click(statusSelect);
    
    const inProgressOption = screen.getByText("In Progress");
    fireEvent.click(inProgressOption);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bugs/bug-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            status: "IN_PROGRESS",
            userId: "user-1",
          }),
        })
      );
      expect(screen.getByText("IN_PROGRESS")).toBeInTheDocument();
    });
  });

  it("toggles sidebar visibility", async () => {
    render(<BugDetailPage params={Promise.resolve({ id: "bug-1" })} />);

    await waitFor(() => {
      findTextContent("Login page not loading");
    });

    // Verify sidebar is initially visible
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/priority/i)).toBeInTheDocument();

    // Find and click toggle button
    const toggleButton = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(toggleButton);

    // Verify sidebar is hidden
    await waitFor(() => {
      expect(screen.queryByText(/status/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/priority/i)).not.toBeInTheDocument();
    });

    // Toggle back
    fireEvent.click(toggleButton);

    // Verify sidebar is visible again
    await waitFor(() => {
      expect(screen.getByText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/priority/i)).toBeInTheDocument();
    });
  });

  it("shows error message when fetch fails", async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.reject(new Error("Failed to fetch"))
    );

    render(<BugDetailPage params={Promise.resolve({ id: "bug-1" })} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });
});