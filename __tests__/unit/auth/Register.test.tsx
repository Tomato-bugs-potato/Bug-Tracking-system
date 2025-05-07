// __tests__/unit/auth/RegisterPage.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "@/app/register/page";
import axios from "axios";
import '@testing-library/jest-dom';
import { useRouter } from "next/router";
import router from "next-router-mock";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("RegisterPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockImplementation(() => mockRouter);
    mockedAxios.post.mockClear();
    window.location.href = "";
  });

  it("renders the registration form correctly", () => {
    render(<RegisterPage />);

    expect(screen.getByText("Create an Account")).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
  });

  it("shows loading state when submitting", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    render(<RegisterPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(screen.getByText("Creating account...")).toBeInTheDocument();
    });
  });

 it("validates all form fields on submit", async () => {
  render(<RegisterPage />);

  // Attempt submit with empty form
  fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

  // Check all required field errors
  await waitFor(() => {
    expect(screen.getByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  // Fill invalid values and test validation messages
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "A" }, // Too short (if you have min length validation)
  });
  fireEvent.change(screen.getByLabelText("Last name"), {
    target: { value: "B" }, // Too short (if you have min length validation)
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "invalid-email" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "short" },
  });
  fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "different" },
  });

  // Submit again with invalid values
  fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

  await waitFor(() => {
    // Check all validation messages are shown
    expect(
      screen.getByText("Please enter a valid email")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 8 characters")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Passwords do not match")
    ).toBeInTheDocument();
    
    // Verify axios was not called due to validation errors
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  // Now fill valid values and verify no errors
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "John" },
  });
  fireEvent.change(screen.getByLabelText("Last name"), {
    target: { value: "Doe" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "valid@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "validpassword" },
  });
  fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "validpassword" },
  });

  // Submit with valid values
  fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

  await waitFor(() => {
    // Verify all error messages are cleared
    expect(
      screen.queryByText("First name is required")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Last name is required")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Email is required")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Password is required")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Please enter a valid email")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Password must be at least 8 characters")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Passwords do not match")
    ).not.toBeInTheDocument();
  });
});

 it("handles successful registration", async () => {
  // Mock window.location.href
  delete window.location;
  window.location = { ...window.location, href: "" };

  mockedAxios.post.mockResolvedValueOnce({ data: {} });

  render(<RegisterPage />);

  fillValidForm();
  fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

  await waitFor(() => {
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/auth/register", {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });
  });

  // Check if location.href was set to "/dashboard"
  await waitFor(() => {
    expect(window.location.href).toBe("/dashboard");
  });
});

  it("handles registration error", async () => {
    const errorMessage = "Email already in use";
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });

    render(<RegisterPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("handles network error", async () => {
    const errorMessage = "Network error";
    mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

    render(<RegisterPage />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(
        screen.getByText("Registration failed. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("has working sign in link", () => {
    render(<RegisterPage />);

    expect(screen.getByText("Sign in")).toHaveAttribute("href", "/login");
  });

  function fillValidForm() {
    fireEvent.change(screen.getByLabelText("First name"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText("Last name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
  }
});