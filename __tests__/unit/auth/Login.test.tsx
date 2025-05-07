// __test__/unit/auth/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import * as navigation from "next/navigation";
import { useUser } from "@/app/context/user-context";
import "@testing-library/jest-dom";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;
// Update the localStorage mock at the top of the file
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock user context
jest.mock("@/app/context/user-context", () => ({
  useUser: jest.fn(),
}));

// localStorage = localStorageMock as any;

describe("LoginPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockSetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (navigation.useRouter as jest.Mock).mockImplementation(() => mockRouter);
    (useUser as jest.Mock).mockImplementation(() => ({ setUser: mockSetUser }));
    mockFetch.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("renders the login form correctly", () => {
    render(<LoginPage />);

    expect(screen.getByText("BugTracker")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it("shows loading state when submitting", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ user: { id: "123" }, redirect: "/dashboard" }),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
    });
  });

  it("handles successful login with redirect", async () => {
    const mockUser = { id: "123", name: "Test User" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, redirect: "/dashboard" }),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith("userId", "123");
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("handles successful login without redirect", async () => {
    const mockUser = { id: "123", name: "Test User" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser }),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays error message when login fails", async () => {
    const errorMessage = "Invalid credentials";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: errorMessage }),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("displays error message when fetch fails", async () => {
    const errorMessage = "Network error";
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("requires email and password", async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeInvalid();
      expect(screen.getByLabelText("Password")).toBeInvalid();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeInvalid();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("has working links", () => {
    render(<LoginPage />);

    expect(screen.getByText("Forgot password?")).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    expect(screen.getByText("Sign up")).toHaveAttribute("href", "/register");
  });
});
