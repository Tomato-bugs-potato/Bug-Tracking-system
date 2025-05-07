// __test__/unit/projects/NewProjectPage.test.tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NewProjectPage from '@/app/dashboard/projects/new/page';
import * as navigation from 'next/navigation';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('NewProjectPage', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockUsers = [
    { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
  ];

  const mockSession = { user: { id: 'current-user' } };

  beforeEach(() => {
    jest.clearAllMocks();
    (navigation.useRouter as jest.Mock).mockImplementation(() => mockRouter);
    mockFetch.mockClear();
  });

  it('renders loading state initially', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        });
      }
      if (url.includes('/api/users')) {
        return new Promise(() => {}); // Never resolves to simulate loading
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<NewProjectPage />);
    });

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('shows login required when no user session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: null }),
    });

    await act(async () => {
      render(<NewProjectPage />);
    });

    expect(
      screen.getByText(/You must be logged in to create a project/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Go to Login')).toBeInTheDocument();
  });

  it('renders form with all fields when user is authenticated', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
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
      render(<NewProjectPage />);
    });

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Git Integration')).toBeInTheDocument();
    expect(screen.getByText('Add Team Members')).toBeInTheDocument();
  });

  it('switches between basic info and git integration tabs', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
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
      render(<NewProjectPage />);
    });

    // Default to basic info tab
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();

    // Switch to git integration tab
    await act(async () => {
      fireEvent.click(screen.getByText('Git Integration'));
    });

    expect(screen.getByLabelText('Repository URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Branch')).toBeInTheDocument();
  });

  it('adds and removes team members', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
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
      render(<NewProjectPage />);
    });

    // Open user select
    await act(async () => {
      fireEvent.click(screen.getByText('Add Team Members'));
    });

    // Add a user
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'user-1' },
      });
      fireEvent.click(screen.getByText('John Doe (john@example.com)'));
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Remove the user
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Remove John Doe'));
    });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    const mockProject = {
      id: 'project-1',
      name: 'New Project',
      description: 'Test description',
    };

    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: mockProject }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<NewProjectPage />);
    });

    // Fill out the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Project Name'), {
        target: { value: 'New Project' },
      });
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test description' },
      });
      fireEvent.click(screen.getByText('Add Team Members'));
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'user-1' },
      });
      fireEvent.click(screen.getByText('John Doe (john@example.com)'));
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('Create Project'));
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/dashboard/projects/project-1'
      );
    });
  });

  it('shows error when form submission fails', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Project creation failed' }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<NewProjectPage />);
    });

    // Submit the form without filling required fields
    await act(async () => {
      fireEvent.click(screen.getByText('Create Project'));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Project creation failed/i)
      ).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
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
      render(<NewProjectPage />);
    });

    // Try to submit without filling required name field
    await act(async () => {
      fireEvent.click(screen.getByText('Create Project'));
    });

    expect(screen.getByLabelText('Project Name')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });
});