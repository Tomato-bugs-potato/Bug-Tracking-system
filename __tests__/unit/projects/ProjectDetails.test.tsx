// __tests__/unit/projects/ProjectDetails.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectDetailPage from "@/app/dashboard/projects/[id]/page";
import * as navigation from "next/navigation";
import '@testing-library/jest-dom';
import { useRouter } from "next/navigation";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe("ProjectDetailPage", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockProject = {
    id: "project-1",
    name: "Test Project",
    description: "Test description",
    status: "ACTIVE",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-02T00:00:00Z",
    gitUrl: "https://github.com/test/test-repo",
    gitProvider: "github",
    gitBranch: "main",
    apiKey: "test-api-key-123",
    members: [
      {
        id: "member-1",
        role: "OWNER",
        user: {
          id: "user-1",
          name: "John Doe",
          email: "john@example.com",
          image: "https://example.com/john.jpg",
        },
      },
    ],
  };

  const mockBugs = [
    {
      id: "bug-1",
      title: "Test Bug",
      status: "OPEN",
      priority: "HIGH",
      severity: "CRITICAL",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-02T00:00:00Z",
      assignee: {
        id: "user-1",
        name: "John Doe",
      },
      reporter: {
        id: "user-2",
        name: "Jane Smith",
      },
    },
  ];

  const mockActivities = [
    {
      id: "activity-1",
      action: "created the bug",
      createdAt: "2023-01-01T00:00:00Z",
      user: {
        id: "user-1",
        name: "John Doe",
      },
      bugId: "bug-1",
      bug: {
        id: "bug-1",
        title: "Test Bug",
      },
    },
  ];

  const mockUsers = [
    { id: "user-1", name: "John Doe", email: "john@example.com" },
    { id: "user-2", name: "Jane Smith", email: "jane@example.com" },
  ];

  const mockSession = { user: { id: "user-1" } };

  beforeEach(() => {
    jest.clearAllMocks();
    (navigation.useRouter as jest.Mock).mockImplementation(() => mockRouter);
    (navigation.useParams as jest.Mock).mockImplementation(() => ({ id: "project-1" }));
    mockFetch.mockClear();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'user-1'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it("renders loading state initially", () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<ProjectDetailPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays project details after successful fetch", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes("/api/projects/project-1/activities")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ activities: mockActivities }),
        });
      }
      if (url.includes("/api/projects/project-1/bugs")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bugs: mockBugs }),
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
          json: () => Promise.resolve(mockSession),
        });
      }
      if (url.includes("/api/bug-tracker-templates")) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("Mock template content"),
        });
      }
      if (url.includes("/api/dashboard/summary")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            totalBugs: 1,
            openBugs: 1,
            resolvedBugs: 0,
            totalProjects: 1,
            activeProjects: 1,
            totalUsers: 2,
            recentActivity: []
          }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(mockProject.name)).toBeInTheDocument();
      expect(screen.getByText(mockProject.description)).toBeInTheDocument();
      expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    });
  });

  it("shows error message when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));
    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch project/i)).toBeInTheDocument();
    });
  });

  it("displays bugs section correctly", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes("/api/projects/project-1/bugs")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bugs: mockBugs }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Project Bugs")).toBeInTheDocument();
      expect(screen.getByText("Test Bug")).toBeInTheDocument();
      expect(screen.getByText("HIGH")).toBeInTheDocument();
    });
  });

  it("displays team members section correctly", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes("/api/users")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Team Members")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("OWNER")).toBeInTheDocument();
    });
  });

  it("displays GitHub integration section correctly", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("GitHub Integration")).toBeInTheDocument();
      expect(screen.getByText("https://github.com/test/test-repo")).toBeInTheDocument();
      expect(screen.getByText("main")).toBeInTheDocument();
    });
  });

  it("handles API key visibility toggle", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      const showButton = screen.getByText("Show");
      fireEvent.click(showButton);
      expect(screen.getByText("Hide")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test-api-key-123")).toBeInTheDocument();
    });
  });

  it("copies API key to clipboard", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      const copyButton = screen.getAllByRole("button", { name: /copy/i })[1];
      fireEvent.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test-api-key-123");
    });
  });

  it("opens GitHub setup instructions dialog", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      const setupButton = screen.getByText("Setup Instructions");
      fireEvent.click(setupButton);
      expect(screen.getByText("GitHub CI Integration Setup")).toBeInTheDocument();
    });
  });

  it("regenerates API key", async () => {
    const newApiKey = "new-api-key-456";
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes("/api/projects/project-1/regenerate-key")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ apiKey: newApiKey }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      const regenerateButton = screen.getByText("Regenerate API Key");
      fireEvent.click(regenerateButton);
    });

    await waitFor(() => {
      expect(screen.getByText("API key regenerated successfully")).toBeInTheDocument();
    });
  });

  it("navigates to new bug page", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      const newBugButton = screen.getByText("New Bug");
      fireEvent.click(newBugButton);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/dashboard/bugs/new?projectId=project-1"
      );
    });
  });

  it("handles adding a new team member", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes("/api/users")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      if (url.includes("/api/projects/project-1/members")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            member: {
              id: "member-2",
              role: "MEMBER",
              user: mockUsers[1]
            }
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      const addButton = screen.getByText("Add Team Members");
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "user-2" } });
      const addMemberButton = screen.getByText("Add");
      fireEvent.click(addMemberButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("handles removing a team member", async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes("/api/projects/project-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes("/api/projects/project-1/members/member-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<ProjectDetailPage />);

    await waitFor(() => {
      const removeButton = screen.getByLabelText("Remove John Doe");
      fireEvent.click(removeButton);
    });

    await waitFor(() => {
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });
});