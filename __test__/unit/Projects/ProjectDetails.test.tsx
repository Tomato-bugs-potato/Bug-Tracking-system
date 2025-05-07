import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProjectDetailPage from '@/app/dashboard/projects/[id]/page';
import * as navigation from 'next/navigation';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({ id: 'project-1' })),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ProjectDetailPage', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test description',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gitUrl: 'https://github.com/test/repo',
    gitBranch: 'main',
    gitProvider: 'github',
    apiKey: 'test-api-key',
    members: [
      {
        id: 'member-1',
        role: 'OWNER',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          image: 'https://example.com/john.jpg'
        }
      }
    ]
  };

  const mockBugs = [
    {
      id: 'bug-1',
      title: 'Test Bug',
      status: 'OPEN',
      priority: 'HIGH',
      severity: 'CRITICAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporter: {
        id: 'user-1',
        name: 'John Doe'
      }
    }
  ];

  const mockActivities = [
    {
      id: 'activity-1',
      action: 'created bug',
      createdAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        name: 'John Doe'
      },
      bugId: 'bug-1',
      bug: {
        id: 'bug-1',
        title: 'Test Bug'
      }
    }
  ];

  const mockUsers = [
    { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (navigation.useRouter as jest.Mock).mockImplementation(() => mockRouter);
    mockFetch.mockClear();
  });

  // Test 1: Renders project details correctly
  it('renders project details correctly', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/projects/project-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes('/api/projects/project-1/activities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ activities: mockActivities }),
        });
      }
      if (url.includes('/api/projects/project-1/bugs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bugs: mockBugs }),
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<ProjectDetailPage />);
    });

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('github.com/test/repo')).toBeInTheDocument();
  });

  // Test 2: Displays loading state initially
  it('displays loading state initially', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/projects/project-1')) {
        return new Promise(() => {}); // Never resolves
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<ProjectDetailPage />);
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // Test 3: Shows error when project fetch fails
  it('shows error when project fetch fails', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/projects/project-1')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Project not found' }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<ProjectDetailPage />);
    });

    expect(screen.getByText(/Project not found/i)).toBeInTheDocument();
  });

  // Test 4: Adds a team member successfully
  it('adds a team member successfully', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/projects/project-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      if (url.includes('/api/projects/project-1/members')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<ProjectDetailPage />);
    });

    // Select user
    const select = screen.getByRole('combobox', { name: /select a user to add/i });
    await act(async () => {
      fireEvent.change(select, { target: { value: 'user-2' } });
    });

    // Click add button
    const addButton = screen.getByRole('button', { name: /add/i });
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/project-1/members',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  // Test 5: Copies API key to clipboard
  it('copies API key to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/projects/project-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<ProjectDetailPage />);
    });

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-api-key');
  });

  // Test 6: Displays bugs list
  it('displays bugs list', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/projects/project-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      if (url.includes('/api/projects/project-1/bugs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bugs: mockBugs }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<ProjectDetailPage />);
    });

    expect(screen.getByText('Test Bug')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  // Test 7: Shows GitHub integration section
  it('shows GitHub integration section', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/projects/project-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<ProjectDetailPage />);
    });

    expect(screen.getByText('GitHub Integration')).toBeInTheDocument();
    expect(screen.getByText('github.com/test/repo')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });
});