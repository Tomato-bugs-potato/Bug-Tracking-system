// __test__/unit/projects/ProjectsPage.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectsPage from "@/app/dashboard/projects/page";
import * as navigation from "next/navigation";
import '@testing-library/jest-dom';
import { useRouter } from "next/navigation";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ProjectsPage", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockProjects = [
    {
      id: "project-1",
      name: "Frontend App",
      description: "The main customer-facing application",
      status: "ACTIVE",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-02T00:00:00Z",
      gitUrl: "https://github.com/example/frontend",
      _count: {
        bugs: 5,
        members: 3,
      },
      members: [
        {
          user: {
            id: "user-1",
            name: "John Doe",
            image: "https://example.com/john.jpg",
          },
        },
        {
          user: {
            id: "user-2",
            name: "Jane Smith",
          },
        },
      ],
    },
    {
      id: "project-2",
      name: "Backend Service",
      description: "API service for data processing",
      status: "ON_HOLD",
      createdAt: "2023-02-01T00:00:00Z",
      updatedAt: "2023-02-15T00:00:00Z",
      gitUrl: null,
      _count: {
        bugs: 2,
        members: 1,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (navigation.useRouter as jest.Mock).mockImplementation(() => mockRouter);
    mockFetch.mockClear();
  });

  it("renders loading state initially", () => {
    render(<ProjectsPage />);
    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  it("displays projects after successful fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText("Frontend App")).toBeInTheDocument();
      expect(screen.getByText("Backend Service")).toBeInTheDocument();
    });
  });

  it("shows error message when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/i)).toBeInTheDocument();
    });
  });

  it("filters projects by search query", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText("Frontend App")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search projects...");
    fireEvent.change(searchInput, { target: { value: "Backend" } });

    await waitFor(() => {
      expect(screen.queryByText("Frontend App")).not.toBeInTheDocument();
      expect(screen.getByText("Backend Service")).toBeInTheDocument();
    });
  });

  it("filters projects by status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText("Frontend App")).toBeInTheDocument();
      expect(screen.getByText("Backend Service")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Active"));

    await waitFor(() => {
      expect(screen.getByText("Frontend App")).toBeInTheDocument();
      expect(screen.queryByText("Backend Service")).not.toBeInTheDocument();
    });
  });

  it("switches between card and table view", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ projects: mockProjects }),
  });

  render(<ProjectsPage />);

  await waitFor(() => {
    expect(screen.getByText("Frontend App")).toBeInTheDocument();
  });

  // Default is card view - verify by checking for card-specific content
  expect(screen.getByText("The main customer-facing application")).toBeInTheDocument();

  // Open the view type dropdown
  const viewDropdown = screen.getByRole('button', { name: /Card View/i });
  fireEvent.click(viewDropdown);

  // Now select Table View from the dropdown
  const tableViewOption = await screen.findByText("Table View");
  fireEvent.click(tableViewOption);

  await waitFor(() => {
    // Verify table-specific content appears
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});

  it("displays project details correctly in card view", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      const projectCard = screen.getByText("Frontend App").closest("div");
      expect(projectCard).toHaveTextContent("The main customer-facing application");
      expect(projectCard).toHaveTextContent("5");
      expect(projectCard).toHaveTextContent("3");
      expect(projectCard).toHaveTextContent("Yes");
    });
  });

  it("displays project details correctly in table view", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    });

    render(<ProjectsPage />);

    // Switch to table view first
    fireEvent.click(screen.getByText("Card View"));
    fireEvent.click(screen.getByText("Table View"));

    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(table).toHaveTextContent("Frontend App");
      expect(table).toHaveTextContent("ACTIVE");
      expect(table).toHaveTextContent("5");
      expect(table).toHaveTextContent("3");
      expect(table).toHaveTextContent("Connected");
    });
  });

  it("shows empty state when no projects match filters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText("Frontend App")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search projects...");
    fireEvent.change(searchInput, { target: { value: "Non-existent project" } });

    await waitFor(() => {
      expect(screen.getByText("No projects found")).toBeInTheDocument();
    });
  });

  it("handles project status badges correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      const activeBadge = screen.getByText("ACTIVE");
      const onHoldBadge = screen.getByText("ON_HOLD");
      
      expect(activeBadge).toHaveClass("bg-green-100");
      expect(onHoldBadge).toHaveClass("bg-yellow-100");
    });
  });

  it("navigates to project details when clicking on project name", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      const projectLink = screen.getByText("Frontend App").closest("a");
      expect(projectLink).toHaveAttribute("href", "/dashboard/projects/project-1");
    });
  });
});