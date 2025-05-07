# Bug Tracker Test Suite

This directory contains comprehensive tests for the Bug Tracking System.

## Directory Structure

```
__tests__/
├── unit/                    # Unit tests for components
│   ├── auth/               # Authentication components
│   ├── bugs/               # Bug-related components
│   ├── projects/           # Project-related components
│  
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   └── features/          # Feature integration tests
├── e2e/                   # End-to-end tests
│   └── workflows/         # User workflow tests
└── utils/                 # Test utilities and helpers
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- __tests__/unit/auth/Login.test.tsx

# Run tests in watch mode
npm test -- --watch
```

## Test Categories

1. Unit Tests: Testing individual components in isolation
2. Integration Tests: Testing component interactions
3. E2E Tests: Testing complete user workflows
4. API Tests: Testing backend API endpoints

## Coverage Requirements

- Unit Tests: 80% coverage
- Integration Tests: 70% coverage
- E2E Tests: Key user workflows
