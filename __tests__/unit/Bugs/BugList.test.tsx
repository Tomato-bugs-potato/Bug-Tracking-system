import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BugsPage from "@/app/dashboard/bugs/page";
import * as navigation from "next/navigation";
import '@testing-library/jest-dom';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe("BugsPage", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockBugs = [
    {
      id: "bug-1",
      title: "Login page not loading",
      status: "OPEN",
      priority: "HIGH",
      severity: "CRITICAL",
      project: { name: "Frontend App" },
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-02T00:00:00Z",
    },
    {
      id: "bug-2",
      title: "API 500 error",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      severity: "MAJOR",
      assignee: { name: "John Doe" },
      project: { name: "Backend API" },
      createdAt: "2023-01-03T00:00:00Z",
      updatedAt: "2023-01-04T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (navigation.useRouter as jest.Mock).mockImplementation(() => mockRouter);
    mockFetch.mockClear();
  });

  it("renders the page correctly", () => {
    render(<BugsPage />);

    expect(screen.getByText("Bugs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Bug/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search bugs...")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    render(<BugsPage />);
    expect(screen.getByText("Loading bugs...")).toBeInTheDocument();
  });

  it("displays bugs after successful fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bugs: mockBugs }),
    });

    render(<BugsPage />);

    await waitFor(() => {
      expect(screen.getByText("Login page not loading")).toBeInTheDocument();
      expect(screen.getByText("API 500 error")).toBeInTheDocument();
    });
  });

  it("handles search functionality", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bugs: mockBugs }),
    });

    render(<BugsPage />);

    const searchInput = screen.getByPlaceholderText("Search bugs...");
    fireEvent.change(searchInput, { target: { value: "login" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=login")
      );
    });
  });

  it("filters by status", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bugs: mockBugs }),
    });

    render(<BugsPage />);

    const statusFilter = screen.getByText("All Statuses");
    fireEvent.click(statusFilter);

    const openOption = screen.getByText("Open");
    fireEvent.click(openOption);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=OPEN")
      );
    });
  });

  it("filters by project", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bugs: mockBugs }),
    });

    render(<BugsPage />);

    const projectFilter = screen.getByText("All Projects");
    fireEvent.click(projectFilter);

    const backendOption = screen.getByText("Backend API");
    fireEvent.click(backendOption);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("projectId=2")
      );
    });
  });

  it("shows error message when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<BugsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it("displays 'No bugs found' when there are no bugs", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bugs: [] }),
    });

    render(<BugsPage />);

    await waitFor(() => {
      expect(screen.getByText("No bugs found")).toBeInTheDocument();
    });
  });

  it("applies priority filters from quick filters", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bugs: mockBugs }),
    });

    render(<BugsPage />);

    const quickFiltersButton = screen.getByRole("button", { name: /Quick filters/i });
    fireEvent.click(quickFiltersButton);

    const highPriorityCheckbox = screen.getByLabelText("HIGH");
    fireEvent.click(highPriorityCheckbox);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("priority=HIGH")
      );
    });
  });

  it("applies severity filters from advanced filters", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bugs: mockBugs }),
    });

    render(<BugsPage />);

    const advancedFiltersButton = screen.getByRole("button", { name: /Advanced filters/i });
    fireEvent.click(advancedFiltersButton);

    const criticalSeverityCheckbox = screen.getByLabelText("CRITICAL");
    fireEvent.click(criticalSeverityCheckbox);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("severity=CRITICAL")
      );
    });
  });

  it("handles assignment filters", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bugs: mockBugs }),
    });

    render(<BugsPage />);

    const quickFiltersButton = screen.getByRole("button", { name: /Quick filters/i });
    fireEvent.click(quickFiltersButton);

    const assignedToMeCheckbox = screen.getByLabelText("Assigned to me");
    fireEvent.click(assignedToMeCheckbox);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("assignedToMe=true")
      );
    });
  });
});