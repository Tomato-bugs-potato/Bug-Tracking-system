import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
}));

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global TextEncoder/TextDecoder mock
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.fetch
global.fetch = jest.fn();
